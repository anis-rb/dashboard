import { createFileRoute } from "@tanstack/react-router";
const blocked = () => Response.json({ error: "Use RefBuddy ID/email sign-in." }, { status: 404, headers: { "Cache-Control": "no-store" } });
export const Route = createFileRoute("/api/auth/$")({ server: { handlers: { GET: blocked, POST: blocked } } });
