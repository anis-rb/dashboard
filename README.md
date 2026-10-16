# RB Desk

RB Desk is a role-based CRM dashboard for administrators, partners, champions, and city heads. Google Sheets is the sole database for user credentials, CRM records, and login sessions.

## Components

- Frontend: `src/components/desk/` and `src/routes/`
- Private server bridge: `src/routes/api/rb-login.tsx`, `src/routes/api/rb-session.tsx`, and `src/lib/rb/server.ts`
- Google Apps Script backend: `integrations/google-apps-script/Code.gs`
- Setup: `SETUP.md`

The Apps Script URL, spreadsheet ID, access token, and password pepper are server-side configuration only. Never commit them or expose them in `VITE_` variables. No PostgreSQL database is required by the Sheets-only authentication flow. This is a standalone web app, not a WordPress plugin; link to the deployed app from WordPress.

Use a restricted staging copy of the spreadsheet before production. See [SETUP.md](SETUP.md).
