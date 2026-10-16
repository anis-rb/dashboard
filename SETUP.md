# RB Desk setup: Sheet credentials and private Google Sheets backend

This is a standalone web app source package, not a WordPress plugin. The login accepts the unique ID or email and password in `RB Admins` / `RB Registration`. The browser sends credentials only to the app server. The app server checks the private Apps Script endpoint; approved, active Sheet users are then given an HttpOnly Better Auth session. The Sheet URL, access token, and password pepper are server-side only.

## Before connecting real data

1. Make a backup copy of the spreadsheet.
2. Set Google Sheets **General access** to **Restricted** and give access only to staff who need to maintain the data. Do not publish the workbook or its link.
3. Check that every administrator and user row has a valid email address as well as its unique ID. The ID is the Sheet login name; the email is the private session identity.
4. Add these columns to existing tabs if they are not already present:
   - `RB Registration`: `Sponsor ID` (needed for onboarding/referral relationships). Keep your existing `Role_ID`, `APPROVED`, and `IS_ACTIVE` columns.
   - `RB Admins`: `Active` (recommended, so an admin can be disabled without deleting the row). Your existing `Role_ID` is used as the admin unique ID.
   - `Lead tracker`: `Status History` (needed to retain status transitions). Your current `CREATED_AT`, `LEAD_ID`, `LEAD_MOBILE`, `LEAD_NAME`, `LEAD_STATUS`, `LEAD_EMAILID`, `SERVICE_ID`, `GIVE_ID`, `TAKE_ID`, `DEAL_VALUE`, `COMMISSION_AMOUNT`, `LEAD_SOURCE`, `QUALITY_OF_LEAD`, `LEAD_OWNER`, `UPDATED_AT`, `PARTNER_REMARK`, and `ADMIN_REMARK` are mapped by the backend.
5. If you want Marketing and Department dashboards populated, add tabs named `Marketing` and `Departments` with the headers shown below. Your existing `RB Theme` Setting/Value layout is supported. Existing `RB Categories` and `RB Services` headers are mapped.

Marketing headers: `Campaign ID`, `Name`, `Channel`, `Spend`, `Leads`, `Status`, `Start Date`, `End Date`, `Note`.

Departments headers: `Metric ID`, `Department`, `Label`, `Value`, `Note`, `Updated Date`.

## Install the Apps Script backend

1. Open the spreadsheet and choose **Extensions → Apps Script**.
2. Replace the script contents with `integrations/google-apps-script/Code.gs` from this package, then save.
3. In Apps Script **Project Settings → Script Properties**, set:
   - `RB_SPREADSHEET_ID`: the ID between `/d/` and `/edit` in the Sheet URL.
   - `RB_ACCESS_TOKEN`: a new random secret with at least 32 characters.
   - `RB_PASSWORD_PEPPER`: a different new random secret with at least 32 characters. Keep a secure backup; changing it later requires hashing all passwords again.
4. From the function picker, run `migrateSheetPasswords` once. Review the authorization prompt and allow it. It creates a `Password Hash` column on `RB Admins` and `RB Registration`, HMAC-hashes the existing `Password`/`Passwords` values using the private pepper, and clears those plaintext cells. Confirm a backup exists first.
5. Deploy → **New deployment** → **Web app**. Execute as the spreadsheet owner. Set access to **Anyone** so the app server can call it; every request still requires the private token. Keep the spreadsheet itself Restricted. Copy the `/exec` URL.
6. For a user password reset, enter the new password in that user's existing `Password` or `Passwords` cell and rerun `migrateSheetPasswords`; the helper replaces the hash and clears the plaintext cell. Do this only while the workbook is restricted.
7. After changing the code, create a **new Apps Script deployment version** and update the app's private endpoint value if the URL changes.

## Put the app in private GitHub and deploy

1. Create a **private** GitHub repository and upload the extracted ZIP contents. Do not commit Sheet URLs, tokens, passwords, peppers, database URLs, or `.env` files.
2. Import the repository into Vercel. Build command: `npm run build`.
3. Add these server-side Production environment variables in Vercel (never use `VITE_` for these):
   - `RB_SHEETS_WEBAPP_URL` = Apps Script `/exec` URL.
   - `RB_SHEETS_ACCESS_TOKEN` = the same value as Apps Script `RB_ACCESS_TOKEN`.
   - `BETTER_AUTH_URL` = the deployed dashboard's canonical HTTPS origin.
   - `BETTER_AUTH_SECRET` = a new random secret of at least 32 characters.
   - `DATABASE_URL` = PostgreSQL connection string for Better Auth sessions.
4. Redeploy. Add the deployed dashboard URL to the RefBuddy WordPress navigation as **My Dashboard**. This package is not a WordPress plugin; link to it directly and do not embed it in an iframe.
5. The dashboard login is unique ID/email plus password only. Users must exist in the appropriate Sheet tab, have a password hash, and be approved/active before they can sign in. Admin approvals still come from the dashboard.

## Staging and production verification

Before connecting the live workbook, deploy the Apps Script against a **copy** of the Sheet and test each role using test accounts. Verify that sign-in rejects wrong passwords, pending/inactive accounts cannot enter, partners cannot see admin remarks or unrelated users/leads, protected lead fields remain unchanged, status history is written, and edits preserve all existing columns. Then point production to the live Sheet only after confirming the staging results and making a fresh backup.

The code build and TypeScript check can be run locally, but this package has not been authenticated against your live workbook or deployed Apps Script. Apps Script quotas and free hosting/database tiers can change, so total $0 operating cost cannot be guaranteed.
