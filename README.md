# RB Desk

RB Desk is a role-based dashboard for RefBuddy administrators, partners, champions, and city heads. It supports unique ID/email plus password login from the Google Sheet, server-side Sheet verification, role-scoped CRM data, lead search and filters, approvals, onboarding, reports, and Google Apps Script backed data.

## Frontend and backend

- Frontend: `src/components/desk/` and `src/routes/`
- Server-side Sheets/auth bridge: `src/routes/api/rb-login.tsx` and `src/lib/rb/server.ts`
- Google Apps Script backend: `integrations/google-apps-script/Code.gs`
- Deployment and Sheet steps: `SETUP.md`

The Sheet URL, Apps Script access token, password pepper, Better Auth secret, and database URL must remain in private server settings. Do not commit them or place them in browser-visible `VITE_` variables. This is a standalone web app, not a WordPress plugin; add a WordPress menu link to its deployed URL.

Configure and validate first with a restricted staging copy of the workbook. See [SETUP.md](SETUP.md).
