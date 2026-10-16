import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { APPS_SCRIPT } from "@/lib/rb/apps-script";
import { pullNow, pushNow, useDesk } from "@/lib/rb/store";
import { ago } from "@/lib/rb/format";

export function SheetsPanel({ admin }: { admin: boolean }) {
  const lastSync = useDesk((state) => state.lastSync);
  const syncError = useDesk((state) => state.syncError);
  const syncing = useDesk((state) => state.syncing);
  const [copied, setCopied] = useState(false);

  async function run(fn: () => Promise<void>, success: string) {
    try { await fn(); toast.success(success); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Sheets request failed"); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(APPS_SCRIPT); setCopied(true); }
    catch { setCopied(false); toast.error("Select the script below and copy it."); }
  }

  return (
    <div className="grid max-w-3xl gap-4">
      <section className="desk-panel grid gap-3 p-4">
        <h2 className="font-display text-xl">Private Google Sheets connection</h2>
        <p className="text-sm text-muted">The Sheet URL and shared token are used only by the server. They are not stored in this browser or rendered on the dashboard.</p>
        <p className="text-sm">{syncing ? "Syncing…" : syncError ? "Connection needs attention" : lastSync ? `Last sync ${ago(lastSync)}` : "Connected account; data loads from the server."}</p>
        {syncError ? <p role="alert" className="text-sm text-danger">{syncError}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={syncing} onClick={() => void run(pullNow, "Sheet refreshed")}>Refresh</Button>
          <Button disabled={syncing} onClick={() => void run(pushNow, "Changes saved")}>Save now</Button>
        </div>
      </section>
      {admin ? (
        <section className="desk-panel grid gap-3 p-4">
          <h2 className="font-display text-xl">Administrator setup</h2>
          <ol className="grid list-decimal gap-2 pl-5 text-sm text-muted">
            <li>Create a Google Sheet and keep it private. Add a tab named RB Admins and a header row: id, name, email, phone, permissions, active. Add your own account with active set to TRUE.</li>
            <li>Add the other tabs: RB Registration, Lead tracker, RB Categories, RB Services, RB Theme, Marketing, and Departments. The first save creates missing tabs and headers.</li>
            <li>Open Extensions → Apps Script, paste the script below, and set Script Properties RB_SPREADSHEET_ID and RB_ACCESS_TOKEN. Keep the token private.</li>
            <li>Deploy the script as a Web app that executes as you. Set access to Anyone; the shared token is required for all requests.</li>
            <li>In your hosting provider’s private server environment settings, set RB_SHEETS_WEBAPP_URL to the deployment URL ending /exec and RB_SHEETS_ACCESS_TOKEN to the same token. Never put either in page settings or GitHub.</li>
            <li>Restart/redeploy the app, then use Refresh. Do not use Push to seed a sheet; administrator updates are validated and revision checked.</li>
          </ol>
          <div><Button variant="secondary" onClick={() => void copy()}>{copied ? "Copied" : "Copy Apps Script"}</Button></div>
          <label className="grid gap-1 text-xs text-muted">Apps Script source<textarea className="desk-field font-mono text-xs" readOnly spellCheck={false} rows={16} value={APPS_SCRIPT} /></label>
        </section>
      ) : null}
    </div>
  );
}
