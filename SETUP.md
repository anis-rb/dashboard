# RB Desk setup (Google Sheets only)

RB Desk uses Google Sheets for CRM records, credentials, and login sessions. The browser never receives the spreadsheet ID, Apps Script URL, or access token. There is no PostgreSQL database requirement.

## 1. Protect the spreadsheet

1. Make a backup copy.
2. Set Google Sheets sharing to **Restricted**. Do not publish the workbook.
3. Keep one valid email and unique ID for every account. Admin IDs come from `Role_ID`; registration IDs use `Role_ID` or `Registration ID`.
4. Add `Status History` to `Lead tracker` if missing.
5. Add `Sponsor ID` to `RB Registration` if missing. An `Active` column on `RB Admins` is recommended.
6. The first successful login creates the `RB Sessions` tab. It stores hashed session tokens, account IDs/emails, timestamps, expiry, and revocation status. Restrict access to this tab like the rest of the workbook.

Current lead headers mapped include `CREATED_AT`, `LEAD_ID`, `LEAD_MOBILE`, `LEAD_NAME`, `LEAD_STATUS`, `LEAD_EMAILID`, `SERVICE_ID`, `GIVE_ID`, `TAKE_ID`, `DEAL_VALUE`, `COMMISSION_AMOUNT`, `LEAD_SOURCE`, `QUALITY_OF_LEAD`, `LEAD_OWNER`, `UPDATED_AT`, `PARTNER_REMARK`, `ADMIN_REMARK`, and `Status History`.

Optional admin modules can use `Marketing` headers `Campaign ID, Name, Channel, Spend, Leads, Status, Start Date, End Date, Note`, and `Departments` headers `Metric ID, Department, Label, Value, Note, Updated Date`.

## 2. Configure Apps Script

1. Open the spreadsheet"��y��y� **Extensions"��y��y� Apps Script**.
2. Replace the editor contents with `integrations/google-apps-script/Code.gs` from this package and save.
3. Open **Project Settings"��y��y� Script Properties** and add:
   - `RB_SPREADSHEET_ID`: the spreadsheet ID between `/d/` and `/edit` in the Sheet URL.
   - `RB_ACCESS_TOKEN`: a new private random value of at least 32 characters.
   - `RB_PASSWORD_PEPPER`: a different private random value of at least 32 characters.
4. From the function picker, run `migrateSheetPasswords` once. Review the authorization prompt. It adds `Password Hash` columns, hashes the existing `Password`/`Passwords` values, and clears plaintext cells. Back up the workbook first.
5. Choose **Deploy"��y��y� New deployment �w^~)�v Web app**. Execute as the spreadsheet owner. Set access to **Anyone** so the Vercel server can call it; the request still needs the private token. Keep the spreadsheet Restricted.
6. Copy the deployed URL ending in `/exec`.

Passwords are not stored in readable form. If someone forgets a password, an admin must set a temporary password in that user's existing password cell, run `migrateSheetPasswords`, and securely tell the user the temporary password so they can sign in. Do not put passwords, pepper, or access token in Apps Script source code or GitHub.

After changing Code.gs, save, deploy a new version, and update Vercel if the Web app URL changes.

## 3. Deploy the dashboard with Vercel

1. Import the private GitHub repository into Vercel.
2. Use the detected framework settings and build command `npm run build`.
3. In **Project �w^~)�v Settings+�u���R Environment Variables**, add for Production:
   - `RB_SHEETS_WEBAPP_URL`: deployed Apps Script `/exec` URL.
   - `RB_SHEETS_ACCESS_TOKEN`: the exact same value as Apps Script `RB_ACCESS_TOKEN`.
4. Deploy. No `DATABASE_URL`, Better Auth URL, or Better Auth secret is needed for the Sheets-only session implementation.
5. Test using a staging copy of the workbook first. Test admin, partner, and champion visibility, pending/inactive rejection, sign-out, lead updates, status history, and remarks before switching to production data.

The session token itself is HttpOnly and is stored in the Sheet only as a hash. Apps Script is called for session verification, so request speed and free-tier quotas depend on Google Apps Script and Sheets limits. This package has not yet been authenticated against or tested with your live deployment.

## 4. WordPress address

The deployed Vercel URL works as a separate dashboard address. Add it to the WordPress menu as **My Dashboard**.

Using the exact `refbuddy.in/dashboard` path requires the web host in front of WordPress to proxy that path and its assets/API requests to Vercel, and the app must be configured for that base path. A normal WordPress page or menu link alone does not proxy the app. Confirm that your hosting supports path-based reverse proxying before promising that URL.
