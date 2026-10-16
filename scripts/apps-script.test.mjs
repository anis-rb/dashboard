import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { test } from "node:test";

class Sheet {
  constructor(rows = []) { this.rows = rows.map((row) => [...row]); }
  getDataRange() { return { getValues: () => this.rows.map((row) => [...row]) }; }
  getLastColumn() { return this.rows[0]?.length ?? 0; }
  appendRow(values) { this.rows.push([...values]); }
  clearContents() { this.rows = []; }
  setFrozenRows() {}
  getRange(row, column, rowCount = 1, columnCount = 1) {
    return {
      setValues: (values) => values.forEach((line, r) => line.forEach((value, c) => this.set(row + r, column + c, value))),
      setValue: (value) => this.set(row, column, value),
      getValues: () => Array.from({ length: rowCount }, (_, r) => Array.from({ length: columnCount }, (_, c) => this.rows[row + r - 1]?.[column + c - 1] ?? "")),
    };
  }
  set(row, column, value) {
    while (this.rows.length < row) this.rows.push([]);
    while (this.rows[row - 1].length < column) this.rows[row - 1].push("");
    this.rows[row - 1][column - 1] = value;
  }
}

const HEADERS = {
  admins: ["Admin ID", "Name", "Email", "Phone", "Permissions", "Active"],
  registration: ["Registration ID", "Name", "Email", "Phone", "Role", "City", "Status", "Sponsor ID", "Created Date"],
  leads: ["Lead ID", "Name", "Phone Number", "Email", "Service ID", "Lead Source", "Lead Quality", "Status", "GIVE_ID", "TAKE_ID", "Lead Owner", "Deal Value", "Commission", "City", "Notes", "Created Date", "Updated Date", "Status History"],
  categories: ["Category ID", "Name", "Blurb", "Sort Order", "Published"],
  services: ["Service ID", "Category ID", "Name", "Summary", "Commission Percent", "Active"],
  theme: ["Primary Color", "Primary Foreground", "Secondary Color", "Background Color", "Surface Color", "Text Color", "Sidebar Color", "Line Color", "Corner Radius"],
  marketing: ["Campaign ID", "Name", "Channel", "Spend", "Leads", "Status", "Start Date", "End Date", "Note"],
  departments: ["Metric ID", "Department", "Label", "Value", "Note", "Updated Date"],
};

function setup() {
  const stamp = "2026-01-01T00:00:00.000Z";
  const tabs = {
    "RB Admins": new Sheet([HEADERS.admins, ["a1", "Admin", "admin@example.com", "100", "full", true]]),
    "RB Registration": new Sheet([HEADERS.registration,
      ["p1", "Partner One", "p1@example.com", "111", "Partner", "North", "approved", "", stamp],
      ["p2", "Partner Two", "p2@example.com", "222", "Partner", "South", "approved", "", stamp],
      ["c1", "Champion One", "c1@example.com", "333", "Champion", "North", "approved", "p1", stamp],
    ]),
    "Lead tracker": new Sheet([HEADERS.leads,
      ["l1", "Assigned", "555-111", "a@x.test", "svc1", "Web", "Hot", "New Enquiry", "c1", "p1", "p1", 1000, 100, "North", "", stamp, stamp, "[]"],
      ["l2", "Referred", "555-222", "b@x.test", "svc1", "Web", "Warm", "Pending", "p1", "p2", "p2", 2000, 200, "South", "", stamp, stamp, "[]"],
      ["l3", "Private", "555-333", "c@x.test", "svc1", "Ads", "Cold", "Lost", "p2", "p2", "p2", 3000, 300, "South", "", stamp, stamp, "[]"],
    ]),
    "RB Categories": new Sheet([HEADERS.categories, ["cat1", "Home", "", 1, true]]),
    "RB Services": new Sheet([HEADERS.services, ["svc1", "cat1", "Service", "", 10, true]]),
    "RB Theme": new Sheet([HEADERS.theme, ["#123456", "#ffffff", "#abcdef", "#ffffff", "#ffffff", "#222222", "#123456", "#eeeeee", "8px"]]),
    Marketing: new Sheet([HEADERS.marketing]),
    Departments: new Sheet([HEADERS.departments]),
  };
  const properties = new Map([["RB_SPREADSHEET_ID", "sheet"], ["RB_ACCESS_TOKEN", "test-secret"], ["RB_REV", "1"]]);
  const spreadsheet = {
    getSheetByName: (name) => tabs[name] ?? null,
    insertSheet: (name) => (tabs[name] = new Sheet()),
  };
  let uuid = 0;
  const cache = new Map();
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) ?? null, setProperty: (key, value) => properties.set(key, String(value)) }) },
    SpreadsheetApp: { openById: (id) => { assert.equal(id, "sheet"); return spreadsheet; } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (key) => cache.get(key) ?? null, put: (key, value) => cache.set(key, value), remove: (key) => cache.delete(key) }) },
    Utilities: { getUuid: () => `uuid000${++uuid}-test` },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: (value) => ({ value, setMimeType() { return this; } }) },
  };
  vm.createContext(context);
  vm.runInContext(readFileSync(new URL("../integrations/google-apps-script/Code.gs", import.meta.url), "utf8"), context);
  const post = (body, token = "test-secret") => JSON.parse(context.doPost({ postData: { contents: JSON.stringify({ ...body, token }) } }).value);
  return { post, tabs };
}

test("rejects missing or invalid bridge token without returning data", () => {
  const { post } = setup();
  assert.deepEqual(post({ action: "bootstrap", email: "admin@example.com" }, "wrong"), { error: "unauthorized" });
});

test("uses the supplied production headers and scopes partner snapshots", () => {
  const { post } = setup();
  const result = post({ action: "bootstrap", email: "p1@example.com" });
  assert.equal(result.profile.role, "partner");
  assert.deepEqual(result.snapshot.admins, []);
  assert.deepEqual(result.snapshot.leads.map((lead) => lead.id), ["l1", "l2"]);
  assert.equal(result.snapshot.registration.some((person) => person.id === "p2"), false);
  assert.equal(result.snapshot.categories.length, 0);
  assert.equal(result.snapshot.services[0].id, "svc1");
  assert.equal(result.snapshot.services[0].categoryId, "cat1");
  assert.equal(result.snapshot.categories.length, 0);
});

test("partner updates cannot change phone, created date, or a referred-only lead", () => {
  const { post, tabs } = setup();
  const revision = post({ action: "bootstrap", email: "p1@example.com" }).revision;
  const lead = (id, patch = {}) => ({ id, name: id === "l1" ? "Assigned" : "Referred", phone: "999-999", email: "edit@example.com", serviceId: "svc1", source: "Web", quality: "Hot", status: "In Progress", giveId: "p1", takeId: "p1", ownerId: "p1", dealValue: 1500, commission: 150, city: "North", notes: "updated", createdAt: "2099-01-01", updatedAt: "2026-01-02", history: [], ...patch });
  const result = post({ action: "commit", email: "p1@example.com", revision, snapshot: { leads: [lead("l1"), lead("l2", { name: "Attempted takeover" })], registration: [], admins: [], categories: [], services: [], theme: {}, marketing: [], departments: [] } });
  assert.equal(result.ok, true);
  const rows = tabs["Lead tracker"].rows;
  const assigned = rows[1];
  const referred = rows[2];
  assert.equal(assigned[1], "Assigned");
  assert.equal(assigned[2], "555-111");
  assert.equal(assigned[15], "2026-01-01T00:00:00.000Z");
  assert.equal(assigned[11], 1500);
  assert.equal(referred[1], "Referred");
});

test("onboarding remains pending and cannot reuse an administrator email", () => {
  const { post, tabs } = setup();
  const revision = post({ action: "bootstrap", email: "p1@example.com" }).revision;
  const duplicate = post({ action: "commit", email: "p1@example.com", revision, snapshot: { registration: [{ id: "new", name: "Admin duplicate", email: "ADMIN@example.com", role: "champion", city: "North", status: "pending", sponsorId: "p1" }], leads: [], admins: [], categories: [], services: [], theme: {}, marketing: [], departments: [] } });
  assert.match(duplicate.error, /already registered/);
  const request = post({ action: "requestAccess", email: "new@example.com", accountName: "New User", data: { name: "New User", phone: "444", city: "North", role: "champion" } });
  assert.equal(request.status, "pending");
  const newRow = tabs["RB Registration"].rows.at(-1);
  assert.equal(newRow[6], "pending");
});


test("admin category and service rows round-trip through business headers", () => {
  const { post, tabs } = setup();
  const loaded = post({ action: "bootstrap", email: "admin@example.com" });
  assert.equal(loaded.snapshot.categories[0].id, "cat1");
  assert.equal(loaded.snapshot.services[0].id, "svc1");
  loaded.snapshot.categories[0].name = "Changed category";
  loaded.snapshot.services[0].name = "Changed service";
  const saved = post({ action: "commit", email: "admin@example.com", revision: loaded.revision, snapshot: loaded.snapshot });
  assert.equal(saved.ok, true);
  assert.equal(tabs["RB Categories"].rows[1][1], "Changed category");
  assert.equal(tabs["RB Services"].rows[1][2], "Changed service");
});
test("only an admin can approve; approval changes the registration status", () => {
  const { post, tabs } = setup();
  const request = post({ action: "requestAccess", email: "new@example.com", accountName: "New User", data: { name: "New User", phone: "444", city: "North", role: "partner" } });
  assert.equal(request.status, "pending");
  const id = tabs["RB Registration"].rows.at(-1)[0];
  const denied = post({ action: "approve", email: "p1@example.com", id, status: "approved" });
  assert.match(denied.error, /Administrator access required/);
  const approved = post({ action: "approve", email: "admin@example.com", id, status: "approved" });
  assert.equal(approved.ok, true);
  assert.equal(tabs["RB Registration"].rows.at(-1)[6], "approved");
});




test("explicit refresh reads current Sheet data instead of a warm cache", () => {
  const { post, tabs } = setup();
  const first = post({ action: "bootstrap", email: "admin@example.com" });
  assert.equal(first.snapshot.categories[0].name, "Home");
  // Simulate an administrator editing the Sheet directly, outside the bridge.
  tabs["RB Categories"].rows[1][1] = "Updated in Sheet";
  const refreshed = post({ action: "bootstrap", email: "admin@example.com" });
  assert.equal(refreshed.snapshot.categories[0].name, "Updated in Sheet");
});
test("rejects a stale dashboard save after a direct Sheet edit", () => {
  const { post, tabs } = setup();
  const loaded = post({ action: "bootstrap", email: "admin@example.com" });
  loaded.snapshot.categories[0].name = "Dashboard edit";
  tabs["RB Categories"].rows[1][1] = "Direct Sheet edit";
  const result = post({ action: "commit", email: "admin@example.com", revision: loaded.revision, snapshot: loaded.snapshot });
  assert.match(result.error, /Sheet changed since this view loaded/);
  assert.equal(tabs["RB Categories"].rows[1][1], "Direct Sheet edit");
});
