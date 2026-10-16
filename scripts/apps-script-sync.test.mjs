import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("dashboard setup script matches the installable Apps Script source", () => {
  const deployed = readFileSync(new URL("../integrations/google-apps-script/Code.gs", import.meta.url), "utf8").trimEnd();
  const dashboard = readFileSync(new URL("../src/lib/rb/apps-script.ts", import.meta.url), "utf8");
  const prefix = "export const APPS_SCRIPT = `";
  const suffix = "`;";
  assert.ok(dashboard.startsWith(prefix), "Apps Script template export exists");
  assert.ok(dashboard.trimEnd().endsWith(suffix), "Apps Script template is closed");
  const body = dashboard.slice(prefix.length, dashboard.trimEnd().length - suffix.length);
  assert.equal(body, deployed);
});
