import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { createApp } from "./app.js";
import type { GoogleProvider } from "./auth/google.js";
import { provisionUser } from "./auth/service.js";
import { reserveTrialGeneration } from "./product/trial.js";
import { AuthError } from "./auth/security.js";
import { challenge } from "./auth/security.js";
const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
// A dedicated database is mandatory; never clear local/production application tables.
if (databaseUrl && new URL(databaseUrl).pathname !== "/reviesnest_auth_test")
  throw new Error("AUTH_TEST_DATABASE_URL must target reviesnest_auth_test");
const origin = "http://localhost:3000";
describe(
  "authentication and tenant authorization (real MySQL, simulated Google)",
  { skip: !databaseUrl, concurrency: false },
  () => {
    const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const google: GoogleProvider = {
      authorizationUrl({ state, nonce, challenge }) {
        return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ state, nonce, code_challenge: challenge, code_challenge_method: "S256" })}`;
      },
      async identity(code, verifier, nonce) {
        assert.equal(verifier.length, 43);
        assert.equal(nonce.length, 43);
        if (code === "bad") throw new Error("Invalid Google identity");
        return {
          subject: `google-${code}`,
          email: `${code}@example.test`,
          name: code,
        };
      },
    };
    let app = createApp({
      webOrigin: origin,
      checkDependencies: async () => {},
      auth: { db, webOrigin: origin, production: false, google },
    });
    const makeAgent = () => request.agent(app);
    async function login(agent: ReturnType<typeof makeAgent>, code: string) {
      const start = await agent.get("/auth/google");
      assert.equal(start.status, 302);
      const url = new URL(start.headers.location);
      const state = url.searchParams.get("state")!;
      const pending = await db.oAuthAttempt.findFirstOrThrow();
      assert.equal(
        url.searchParams.get("code_challenge"),
        challenge(pending.verifier),
      );
      const callback = await agent
        .get("/auth/google/callback")
        .query({ state, code });
      assert.equal(callback.status, 302);
      const me = await agent.get("/auth/me");
      assert.equal(me.status, 200);
      return { me: me.body, callback, state };
    }
    before(async () => {
      await db.$queryRaw`SELECT 1`;
    });
    beforeEach(async () => {
      app = createApp({
        webOrigin: origin,
        checkDependencies: async () => {},
        auth: { db, webOrigin: origin, production: false, google },
      });
      await db.$transaction([
        db.googleBusinessAttempt.deleteMany(),
        db.googleBusinessConnection.deleteMany(),
        db.trialUsageReservation.deleteMany(),
        db.trialGrant.deleteMany(),
        db.contactInquiry.deleteMany(),
        db.auditLog.deleteMany(),
        db.session.deleteMany(),
        db.oAuthAttempt.deleteMany(),
        db.membership.deleteMany(),
        db.organization.deleteMany(),
        db.user.deleteMany(),
      ]);
    });
    after(async () => {
      await db.$disconnect();
    });
    test("anonymous users cannot read accounts, tenants or admin data", async () => {
      for (const path of [
        "/auth/me",
        "/organizations/unknown",
        "/admin/organizations",
      ])
        assert.equal((await request(app).get(path)).status, 401);
    });
    test("OAuth creates one owner workspace, rotates cookie and stores only hashed session ID", async () => {
      const agent = makeAgent();
      const { me, callback } = await login(agent, "owner");
      assert.equal(me.user.role, "OWNER");
      assert.equal(me.organizations.length, 1);
      assert.ok(!JSON.stringify(me).includes("googleSubject"));
      assert.ok(!JSON.stringify(me).includes("tokenHash"));
      const cookies = callback.headers["set-cookie"] as unknown as string[];
      const sessionCookie = cookies.find((c) =>
        c.startsWith("reviesnest_session="),
      )!;
      assert.ok(sessionCookie.includes("HttpOnly"));
      assert.ok(sessionCookie.includes("SameSite=Lax"));
      const raw = sessionCookie.split(";")[0].split("=")[1];
      assert.notEqual((await db.session.findFirstOrThrow()).tokenHash, raw);
      await login(agent, "owner");
      assert.equal(await db.user.count(), 1);
      assert.equal(await db.organization.count(), 1);
      assert.equal(await db.session.count(), 1);
      assert.ok((await db.auditLog.count({ where: { action: "LOGIN" } })) >= 2);
    });
    test("state is browser-bound, expiring and single-use; failed callback cannot mint a session", async () => {
      const agent = makeAgent();
      const start = await agent.get("/auth/google");
      const state = new URL(start.headers.location).searchParams.get("state")!;
      const other = await request(app)
        .get("/auth/google/callback")
        .query({ state, code: "owner" });
      assert.ok(other.headers.location.includes("invalid_state"));
      assert.equal(await db.session.count(), 0);
      await agent.get("/auth/google/callback").query({ state, code: "owner" });
      assert.equal(await db.session.count(), 1);
      const replay = await agent
        .get("/auth/google/callback")
        .query({ state, code: "owner" });
      assert.ok(replay.headers.location.includes("invalid_state"));
      assert.equal(await db.session.count(), 1);
      const expiredStart = await agent.get("/auth/google");
      const expiredState = new URL(
        expiredStart.headers.location,
      ).searchParams.get("state")!;
      await db.oAuthAttempt.updateMany({ data: { expiresAt: new Date(0) } });
      const expired = await agent
        .get("/auth/google/callback")
        .query({ state: expiredState, code: "owner" });
      assert.ok(expired.headers.location.includes("invalid_state"));
    });
    test("Google cancellation and failed exchange consume the attempt without creating access", async () => {
      for (const mode of ["cancel", "bad"]) {
        const agent = makeAgent();
        const start = await agent.get("/auth/google");
        const state = new URL(start.headers.location).searchParams.get("state");
        const result = await agent
          .get("/auth/google/callback")
          .query(
            mode === "cancel"
              ? { state, error: "access_denied" }
              : { state, code: "bad" },
          );
        assert.ok(
          result.headers.location.includes(
            mode === "cancel" ? "cancelled" : "failed",
          ),
        );
        assert.equal((await agent.get("/auth/me")).status, 401);
      }
      assert.equal(await db.oAuthAttempt.count(), 0);
      assert.equal(await db.session.count(), 0);
    });
    test("owner cannot read or mutate another tenant even with valid CSRF", async () => {
      const a = makeAgent(),
        b = makeAgent();
      const { me: alice } = await login(a, "alice");
      const { me: bob } = await login(b, "bob");
      const own = alice.organizations[0].id,
        other = bob.organizations[0].id;
      assert.equal((await a.get(`/organizations/${own}`)).status, 200);
      assert.equal((await a.get(`/organizations/${other}`)).status, 404);
      assert.equal(
        (
          await a
            .patch(`/organizations/${other}`)
            .set("Origin", origin)
            .set("X-CSRF-Token", alice.csrfToken)
            .send({ name: "Stolen" })
        ).status,
        404,
      );
      assert.notEqual(
        (await db.organization.findUniqueOrThrow({ where: { id: other } }))
          .name,
        "Stolen",
      );
      const ownUpdate = await a
        .patch(`/organizations/${own}`)
        .set("Origin", origin)
        .set("X-CSRF-Token", alice.csrfToken)
        .send({ name: "Alice Café" });
      assert.equal(ownUpdate.status, 200);
      await db.organization.update({
        where: { id: own },
        data: { status: "SUSPENDED" },
      });
      assert.equal((await a.get(`/organizations/${own}`)).status, 404);
    });
    test("account mutation rejects absent/foreign origin, absent/wrong/cross-session CSRF and role assignment", async () => {
      const a = makeAgent(),
        b = makeAgent();
      const { me } = await login(a, "owner");
      const { me: other } = await login(b, "other");
      assert.equal(
        (await a.patch("/auth/account").send({ name: "X" })).status,
        403,
      );
      assert.equal(
        (
          await a
            .patch("/auth/account")
            .set("Origin", "https://evil.test")
            .set("X-CSRF-Token", me.csrfToken)
            .send({ name: "X" })
        ).status,
        403,
      );
      for (const csrf of ["", "wrong", other.csrfToken])
        assert.equal(
          (
            await a
              .patch("/auth/account")
              .set("Origin", origin)
              .set("X-CSRF-Token", csrf)
              .send({ name: "X" })
          ).status,
          403,
        );
      assert.equal(
        (
          await a
            .patch("/auth/account")
            .set("Origin", origin)
            .set("X-CSRF-Token", me.csrfToken)
            .send({ name: "X", role: "SUPER_ADMIN" })
        ).status,
        400,
      );
      assert.equal(
        (await db.user.findUniqueOrThrow({ where: { id: me.user.id } })).role,
        "OWNER",
      );
      assert.equal(
        (
          await a
            .patch("/auth/account")
            .set("Origin", origin)
            .set("X-CSRF-Token", me.csrfToken)
            .send({ name: "Updated Owner" })
        ).status,
        200,
      );
      assert.equal((await a.get("/auth/me")).body.user.name, "Updated Owner");
    });
    test("owners cannot access admin APIs; role is re-read from DB each request", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      assert.equal((await agent.get("/admin/organizations")).status, 403);
      await db.user.update({
        where: { id: me.user.id },
        data: { role: "SUPER_ADMIN" },
      });
      assert.equal((await agent.get("/admin/organizations")).status, 200);
      await db.user.update({
        where: { id: me.user.id },
        data: { role: "OWNER" },
      });
      assert.equal((await agent.get("/admin/organizations")).status, 403);
    });
    test("expired and disabled sessions fail, including subsequent Google sign-in for disabled user", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      await db.session.updateMany({
        where: { userId: me.user.id },
        data: { expiresAt: new Date(0) },
      });
      assert.equal((await agent.get("/auth/me")).status, 401);
      await login(agent, "owner");
      await db.user.update({
        where: { id: me.user.id },
        data: { status: "DISABLED" },
      });
      assert.equal((await agent.get("/auth/me")).status, 403);
      const start = await agent.get("/auth/google");
      const state = new URL(start.headers.location).searchParams.get("state");
      const result = await agent
        .get("/auth/google/callback")
        .query({ state, code: "owner" });
      assert.ok(result.headers.location.includes("disabled"));
    });
    test("logout requires CSRF, revokes access and emits audit event", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      assert.equal((await agent.post("/auth/logout")).status, 403);
      assert.equal(
        (
          await agent
            .post("/auth/logout")
            .set("Origin", origin)
            .set("X-CSRF-Token", me.csrfToken)
        ).status,
        204,
      );
      assert.equal((await agent.get("/auth/me")).status, 401);
      assert.equal(await db.auditLog.count({ where: { action: "LOGOUT" } }), 1);
    });
    test("admin disable revokes target sessions and cannot disable self", async () => {
      const admin = makeAgent(),
        owner = makeAgent();
      const { me: adminMe } = await login(admin, "admin");
      const { me: ownerMe } = await login(owner, "owner");
      await db.user.update({
        where: { id: adminMe.user.id },
        data: { role: "SUPER_ADMIN" },
      });
      assert.equal(
        (
          await admin
            .patch(`/admin/users/${ownerMe.user.id}/status`)
            .set("Origin", origin)
            .set("X-CSRF-Token", adminMe.csrfToken)
            .send({ status: "DISABLED" })
        ).status,
        204,
      );
      assert.equal((await owner.get("/auth/me")).status, 401);
      assert.equal(
        await db.session.count({ where: { userId: ownerMe.user.id } }),
        0,
      );
      assert.equal(
        (
          await admin
            .patch(`/admin/users/${adminMe.user.id}/status`)
            .set("Origin", origin)
            .set("X-CSRF-Token", adminMe.csrfToken)
            .send({ status: "DISABLED" })
        ).status,
        400,
      );
    });
    test("concurrent callbacks consume the same state only once", async () => {
      const start = await request(app).get("/auth/google");
      const state = new URL(start.headers.location).searchParams.get("state");
      const cookie = (
        start.headers["set-cookie"] as unknown as string[]
      )[0].split(";")[0];
      const results = await Promise.all(
        [1, 2].map(() =>
          request(app)
            .get("/auth/google/callback")
            .set("Cookie", cookie)
            .query({ state, code: "owner" }),
        ),
      );
      assert.equal(
        results.filter((result) =>
          result.headers.location.endsWith("/onboarding"),
        ).length,
        1,
      );
      assert.equal(await db.session.count(), 1);
      assert.equal(await db.user.count(), 1);
    });
    test("sign-in initiation is rate limited", async () => {
      let response;
      for (let i = 0; i < 31; i++)
        response = await request(app).get("/auth/google");
      assert.equal(response!.status, 429);
    });
    test("trial starts once for fourteen days with configurable allowances and no card requirement", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      const organizationId = me.organizations[0].id;
      const first = await agent.get(
        `/organizations/${organizationId}/onboarding`,
      );
      assert.equal(first.status, 200);
      assert.equal(first.body.trial.status, "ACTIVE");
      assert.equal(first.body.trial.allowance, 20);
      assert.equal(first.body.trial.used, 0);
      assert.equal(
        Date.parse(first.body.trial.expiresAt) -
          Date.parse(first.body.trial.startedAt),
        14 * 86400000,
      );
      await login(agent, "owner");
      const second = await agent.get(
        `/organizations/${organizationId}/onboarding`,
      );
      assert.equal(second.body.trial.startedAt, first.body.trial.startedAt);
      assert.equal(second.body.trial.expiresAt, first.body.trial.expiresAt);
      assert.equal(await db.trialGrant.count(), 1);
      const config = await request(app).get("/public/config");
      assert.equal(config.body.priceMonthlyInr, 99);
      assert.equal(config.body.integrations.payments, false);
      assert.equal(config.body.trialDays, 14);
    });
    test("deleting an account or changing Google subject cannot reclaim a free trial", async () => {
      const a = makeAgent();
      const { me } = await login(a, "owner");
      const originalOrg = me.organizations[0].id;
      await db.user.delete({ where: { id: me.user.id } });
      const recreated = await provisionUser(
        db,
        { subject: "google-owner", email: "owner@example.test", name: "Again" },
        "test",
      );
      const recreatedMembership = await db.membership.findFirstOrThrow({
        where: { userId: recreated.id },
      });
      assert.notEqual(recreatedMembership.organizationId, originalOrg);
      assert.equal(
        await db.trialGrant.findUnique({
          where: { organizationId: recreatedMembership.organizationId },
        }),
        null,
      );
      const different = await provisionUser(
        db,
        {
          subject: "different-google-subject",
          email: "OWNER@example.test",
          name: "Other subject",
        },
        "test",
      );
      const differentMembership = await db.membership.findFirstOrThrow({
        where: { userId: different.id },
      });
      assert.equal(
        await db.trialGrant.findUnique({
          where: { organizationId: differentMembership.organizationId },
        }),
        null,
      );
      assert.equal(await db.trialGrant.count(), 1);
    });
    test("onboarding saves business and QR appearance while keeping Google steps blocked", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      const path = `/organizations/${me.organizations[0].id}/onboarding`;
      const initial = await agent.get(path);
      assert.equal(initial.body.onboarding.status, "NOT_STARTED");
      assert.equal(
        (
          await agent
            .patch(path)
            .set("Origin", origin)
            .set("X-CSRF-Token", me.csrfToken)
            .send({ step: "qr", greeting: "Welcome", accentColor: "#123456" })
        ).status,
        409,
      );
      assert.equal(
        (
          await agent.patch(path).send({
            step: "business",
            name: "Cafe",
            category: "Cafe",
            city: "Surat",
            phone: "",
          })
        ).status,
        403,
      );
      const business = await agent
        .patch(path)
        .set("Origin", origin)
        .set("X-CSRF-Token", me.csrfToken)
        .send({
          step: "business",
          name: "Cafe",
          category: "Cafe",
          city: "Surat",
          phone: "+91 99999 99999",
        });
      assert.equal(business.status, 200);
      assert.equal(business.body.onboarding.business.name, "Cafe");
      const qr = await agent
        .patch(path)
        .set("Origin", origin)
        .set("X-CSRF-Token", me.csrfToken)
        .send({
          step: "qr",
          greeting: "Tell us about your visit",
          accentColor: "#123456",
        });
      assert.equal(qr.status, 200);
      assert.equal(qr.body.onboarding.status, "AWAITING_GOOGLE");
      assert.equal(qr.body.onboarding.qrSaved, true);
      assert.equal(
        qr.body.onboarding.steps.find(
          (step: { key: string }) => step.key === "google",
        ).status,
        "pending",
      );
      assert.equal(
        qr.body.onboarding.steps.find(
          (step: { key: string }) => step.key === "location",
        ).status,
        "blocked",
      );
      const dates = initial.body.trial;
      assert.equal(qr.body.trial.startedAt, dates.startedAt);
      assert.equal(qr.body.trial.expiresAt, dates.expiresAt);
      const start = await agent.get("/auth/google");
      const state = new URL(start.headers.location).searchParams.get("state");
      const callback = await agent
        .get("/auth/google/callback")
        .query({ state, code: "owner" });
      assert.ok(callback.headers.location.endsWith("/dashboard"));
    });
    test("onboarding rejects cross-tenant access and forged trial/profile completion fields", async () => {
      const a = makeAgent(),
        b = makeAgent();
      const { me: alice } = await login(a, "alice");
      const { me: bob } = await login(b, "bob");
      const other = `/organizations/${bob.organizations[0].id}/onboarding`;
      assert.equal((await a.get(other)).status, 404);
      assert.equal(
        (
          await a
            .patch(other)
            .set("Origin", origin)
            .set("X-CSRF-Token", alice.csrfToken)
            .send({
              step: "business",
              name: "Stolen",
              category: "Cafe",
              city: "Surat",
              phone: "",
            })
        ).status,
        404,
      );
      const own = `/organizations/${alice.organizations[0].id}/onboarding`;
      assert.equal(
        (
          await a
            .patch(own)
            .set("Origin", origin)
            .set("X-CSRF-Token", alice.csrfToken)
            .send({
              step: "business",
              name: "Cafe",
              category: "Cafe",
              city: "Surat",
              phone: "",
              trialExpiresAt: "2099-01-01",
            })
        ).status,
        400,
      );
      assert.equal(
        (
          await a
            .patch(own)
            .set("Origin", origin)
            .set("X-CSRF-Token", alice.csrfToken)
            .send({ step: "google", connected: true })
        ).status,
        400,
      );
      assert.equal((await request(app).get(own)).status, 401);
    });
    test("expired trial denies usage while allowing business setup without restarting dates", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      const organizationId = me.organizations[0].id;
      const grant = await db.trialGrant.update({
        where: { organizationId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });
      await assert.rejects(
        () =>
          reserveTrialGeneration(db, {
            organizationId,
            actorUserId: me.user.id,
            idempotencyKey: "expired-request",
            requestId: "test",
          }),
        (error: unknown) =>
          error instanceof AuthError && error.code === "TRIAL_EXPIRED",
      );
      const response = await agent
        .patch(`/organizations/${organizationId}/onboarding`)
        .set("Origin", origin)
        .set("X-CSRF-Token", me.csrfToken)
        .send({
          step: "business",
          name: "Cafe",
          category: "Cafe",
          city: "Surat",
          phone: "",
        });
      assert.equal(response.status, 200);
      assert.equal(response.body.trial.status, "EXPIRED");
      assert.equal(
        response.body.trial.expiresAt,
        grant.expiresAt.toISOString(),
      );
      assert.equal(response.body.trial.used, 0);
    });
    test("concurrent usage cannot exceed the trial quota", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      const organizationId = me.organizations[0].id;
      await db.trialGrant.update({
        where: { organizationId },
        data: { allowance: 3 },
      });
      const results = await Promise.allSettled(
        Array.from({ length: 10 }, (_, i) =>
          reserveTrialGeneration(db, {
            organizationId,
            actorUserId: me.user.id,
            idempotencyKey: `request-${i}`,
            requestId: "test",
          }),
        ),
      );
      assert.equal(
        results.filter((result) => result.status === "fulfilled").length,
        3,
      );
      assert.equal(
        (await db.trialGrant.findUniqueOrThrow({ where: { organizationId } }))
          .used,
        3,
      );
      assert.equal(await db.trialUsageReservation.count(), 3);
      const summary = await agent.get(
        `/organizations/${organizationId}/onboarding`,
      );
      assert.equal(summary.body.trial.status, "EXHAUSTED");
      assert.equal(summary.body.trial.remaining, 0);
    });
    test("retrying the same generation reservation charges once and foreign users cannot consume quota", async () => {
      const agent = makeAgent(),
        b = makeAgent();
      const { me } = await login(agent, "owner");
      const { me: other } = await login(b, "other");
      const organizationId = me.organizations[0].id;
      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          reserveTrialGeneration(db, {
            organizationId,
            actorUserId: me.user.id,
            idempotencyKey: "same-request",
            requestId: "test",
          }),
        ),
      );
      assert.equal(
        new Set(results.map((result) => result.reservationId)).size,
        1,
      );
      assert.equal(
        results.filter((result) => !result.alreadyReserved).length,
        1,
      );
      assert.equal(
        (await db.trialGrant.findUniqueOrThrow({ where: { organizationId } }))
          .used,
        1,
      );
      await assert.rejects(
        () =>
          reserveTrialGeneration(db, {
            organizationId,
            actorUserId: other.user.id,
            idempotencyKey: "foreign-request",
            requestId: "test",
          }),
        (error: unknown) => error instanceof AuthError && error.status === 404,
      );
    });
    test("config changes apply to new trials without changing existing grants", async () => {
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      const organizationId = me.organizations[0].id;
      const customApp = createApp({
        webOrigin: origin,
        checkDependencies: async () => {},
        auth: {
          db,
          webOrigin: origin,
          production: false,
          google,
          product: {
            trialAiAllowance: 7,
            priceMonthlyInr: 149,
            paidAiAllowance: 100,
          },
        },
      });
      const config = await request(customApp).get("/public/config");
      assert.equal(config.body.trialAiAllowance, 7);
      assert.equal(config.body.priceMonthlyInr, 149);
      await provisionUser(
        db,
        { subject: "new-subject", email: "new@example.test", name: "New" },
        "test",
        { trialAiAllowance: 7, priceMonthlyInr: 149, paidAiAllowance: 100 },
      );
      assert.equal(
        (await db.trialGrant.findUniqueOrThrow({ where: { organizationId } }))
          .allowance,
        20,
      );
      assert.equal(await db.trialGrant.count({ where: { allowance: 7 } }), 1);
    });
    test("contact form validates, stores real inquiries and limits visibility to admins", async () => {
      const payload = {
        name: "Cafe Owner",
        email: "owner@example.test",
        business: "Cafe",
        message: "Please help me get started.",
      };
      assert.equal(
        (
          await request(app)
            .post("/public/contact")
            .set("Origin", "https://evil.test")
            .send(payload)
        ).status,
        403,
      );
      assert.equal(
        (
          await request(app)
            .post("/public/contact")
            .set("Origin", origin)
            .send({ ...payload, message: "Short" })
        ).status,
        400,
      );
      assert.equal(
        (
          await request(app)
            .post("/public/contact")
            .set("Origin", origin)
            .send({ ...payload, website: "spam.example" })
        ).status,
        202,
      );
      assert.equal(await db.contactInquiry.count(), 0);
      assert.equal(
        (
          await request(app)
            .post("/public/contact")
            .set("Origin", origin)
            .send(payload)
        ).status,
        202,
      );
      assert.equal(await db.contactInquiry.count(), 1);
      assert.equal(
        (await request(app).get("/admin/contact-inquiries")).status,
        401,
      );
      const agent = makeAgent();
      const { me } = await login(agent, "owner");
      assert.equal((await agent.get("/admin/contact-inquiries")).status, 403);
      await db.user.update({
        where: { id: me.user.id },
        data: { role: "SUPER_ADMIN" },
      });
      const inbox = await agent.get("/admin/contact-inquiries");
      assert.equal(inbox.status, 200);
      assert.equal(inbox.body.inquiries[0].message, payload.message);
      assert.equal(
        (
          await request(app)
            .post("/public/contact")
            .set("Origin", origin)
            .send(payload)
        ).status,
        202,
      );
      assert.equal(
        (
          await request(app)
            .post("/public/contact")
            .set("Origin", origin)
            .send(payload)
        ).status,
        429,
      );
    });
    test("production cookie is Secure, HttpOnly, host-only and bound to root path", async () => {
      const prod = createApp({
        webOrigin: "https://app.example.test",
        checkDependencies: async () => {},
        auth: {
          db,
          webOrigin: "https://app.example.test",
          production: true,
          google,
        },
      });
      const response = await request(prod).get("/auth/google");
      const cookie = (response.headers["set-cookie"] as unknown as string[])[0];
      assert.ok(cookie.startsWith("__Host-reviesnest_oauth="));
      for (const value of ["Secure", "HttpOnly", "Path=/", "SameSite=Lax"])
        assert.ok(cookie.includes(value));
      assert.ok(!cookie.includes("Domain="));
    });
  },
);
