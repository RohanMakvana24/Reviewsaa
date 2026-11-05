import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "./app.js";
const origin = "http://localhost:3000";
test("readiness fails without exposing dependency secrets; liveness remains available", async () => {
  const app = createApp({
    webOrigin: origin,
    checkDependencies: async () => {
      throw new Error("mysql://secret");
    },
  });
  const ready = await request(app).get("/health/ready");
  assert.equal(ready.status, 503);
  assert.equal(ready.body.status, "unavailable");
  assert.ok(!ready.text.includes("secret"));
  const live = await request(app).get("/health/live");
  assert.equal(live.status, 200);
  assert.ok(live.headers["x-request-id"]);
});
test("healthy dependencies yield readiness and CORS only permits configured origin", async () => {
  const app = createApp({
    webOrigin: origin,
    checkDependencies: async () => {},
  });
  const ready = await request(app).get("/health/ready").set("Origin", origin);
  assert.equal(ready.status, 200);
  assert.equal(ready.headers["access-control-allow-origin"], origin);
  const other = await request(app)
    .get("/health/live")
    .set("Origin", "https://other.invalid");
  assert.notEqual(
    other.headers["access-control-allow-origin"],
    "https://other.invalid",
  );
});
test("malformed JSON returns a safe structured error with request ID", async () => {
  const app = createApp({
    webOrigin: origin,
    checkDependencies: async () => {},
  });
  const response = await request(app)
    .post("/missing")
    .set("Content-Type", "application/json")
    .send("{bad");
  assert.equal(response.status, 400);
  assert.equal(response.body.error, "INVALID_JSON");
  assert.ok(response.body.requestId);
});
