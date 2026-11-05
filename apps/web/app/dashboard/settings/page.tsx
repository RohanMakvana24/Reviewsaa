import { AccountSettings } from "@/components/account-settings";
import { requireSession } from "@/lib/auth";
import { getGoogleBusinessState } from "@/lib/workspace";
import { GoogleConnectionPanel } from "@/components/google-business-panel";
import { SettingsPage } from "@/components/dashboard-pages";
export const metadata = { title: "Settings" };
export default async function Page() {
  const session = await requireSession();
  const org = session.organizations[0];
  const state = org ? await getGoogleBusinessState(org.id) : null;
  return (
    <>
      <AccountSettings
        name={session.user.name}
        email={session.user.email}
        csrfToken={session.csrfToken}
      />
      {org && state && (
        <div className="mb-6">
          <GoogleConnectionPanel
            organizationId={org.id}
            csrfToken={session.csrfToken}
            initial={state}
          />
        </div>
      )}
      <SettingsPage />
    </>
  );
}
