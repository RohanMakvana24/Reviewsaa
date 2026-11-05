"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function AccountSettings({
  name,
  email,
  csrfToken,
}: {
  name: string;
  email: string;
  csrfToken: string;
}) {
  const [value, setValue] = useState(name),
    [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <section className="mb-6 rounded-lg border bg-card p-5">
      <h2 className="text-base font-semibold">Your account</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Signed in as {email}. Your display name is saved to your account.
      </p>
      <form
        className="mt-4 flex flex-wrap items-end gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          try {
            const response = await fetch("/api/auth/account", {
              method: "PATCH",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": csrfToken,
              },
              body: JSON.stringify({ name: value }),
            });
            if (response.status === 401 || response.status === 403) {
              window.location.assign("/login");
              return;
            }
            if (!response.ok)
              throw new Error("Unable to save your name. Please retry.");
            toast.success("Account updated");
            router.refresh();
          } catch {
            toast.error("Unable to save your name. Please retry.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <label htmlFor="account-name" className="text-xs font-medium">
            Display name
          </label>
          <Input
            id="account-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save account"}
        </Button>
      </form>
    </section>
  );
}
