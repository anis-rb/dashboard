import { createMiddleware } from "@tanstack/react-start";
export const authMiddleware = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { assertSameSiteRequest } = await import("./isolation.server");
  const { getSessionUser, UnauthorizedError } = await import("./verify.server");
  assertSameSiteRequest();
  const rbIdentity = await getSessionUser();
  if (!rbIdentity) throw new UnauthorizedError();
  return next({ context: { userId: rbIdentity.id, rbIdentity } });
});
