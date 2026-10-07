import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const code = fs.readFileSync("assets/js/admin-token.js", "utf8");
const storage = (entries = {}) => {
  const data = new Map(Object.entries(entries));
  return { getItem: k => data.get(k) || null, setItem: (k, v) => data.set(k, String(v)), removeItem: k => data.delete(k), data };
};
function boot(local = storage(), session = storage(), fetch = async () => ({ ok: true, status: 200, json: async () => ({ login: "mock-author" }) })) {
  const window = { localStorage: local, sessionStorage: session };
  vm.runInNewContext(code, { window, fetch }); return window.AdminToken;
}
const local = storage({ unrelated: "preserved" }), session = storage();
let auth = boot(local, session);
assert.equal(auth.get(), "");
auth.set("FAKE_TEST_TOKEN", false);
assert.equal(local.getItem("hw_gh_token"), null);
assert.equal(session.getItem("hw_gh_token"), "FAKE_TEST_TOKEN");
assert.equal(boot(local, session).get(), "FAKE_TEST_TOKEN", "reload retains session");
assert.equal(boot(local, storage()).get(), "", "new independent session has no token");
auth.set("FAKE_REMEMBERED_TOKEN", true);
auth = boot(local, storage());
assert.equal(auth.get(), "FAKE_REMEMBERED_TOKEN");
assert.equal(auth.persistent, true);
assert.equal(auth.migrated, false);
auth.clear();
assert.equal(auth.get(), "");
assert.equal(local.getItem("hw_gh_token"), null);
assert.equal(local.getItem("hw_gh_token_remember"), null);
assert.equal(local.getItem("unrelated"), "preserved");
const legacy = storage({ hw_gh_token: "FAKE_LEGACY_TOKEN", unrelated: "preserved" });
auth = boot(legacy, storage());
assert.equal(auth.get(), "FAKE_LEGACY_TOKEN");
assert.equal(auth.migrated, true);
assert.equal(legacy.getItem("hw_gh_token"), null);
assert.equal(legacy.getItem("unrelated"), "preserved");

const requests = [];
auth = boot(storage(), storage(), async (url, options) => {
  requests.push({ url, options });
  return { ok: true, status: 200, json: async () => ({ sha: "MOCK_SHA", login: "mock-author" }) };
});
auth.set("FAKE_API_TOKEN");
await auth.request("/user");
await auth.request("/repos/owner/historyweb/git/blobs", { method: "POST", body: JSON.stringify({ content: "mock article", encoding: "utf-8" }) });
assert.equal(requests[0].url, "https://api.github.com/user");
assert.equal(requests[1].options.headers.Authorization, "Bearer FAKE_API_TOKEN");
assert.equal(requests[1].options.redirect, "error");
assert.ok(!requests[1].url.includes("FAKE_API_TOKEN"));
assert.ok(!requests[1].options.body.includes("FAKE_API_TOKEN"));
await assert.rejects(auth.request("https://evil.example/"));
auth.clear();
await assert.rejects(auth.request("/user"));
assert.equal(requests.length, 2, "invalid/missing token requests never reach network");

auth = boot(storage(), storage(), async () => ({ ok: false, status: 401, json: async () => ({ message: "FAKE_PRIVATE_TOKEN" }) }));
auth.set("FAKE_PRIVATE_TOKEN");
await assert.rejects(auth.request("/user"), error => error.status === 401 && !error.message.includes("FAKE_PRIVATE_TOKEN"));
const denied = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); }, removeItem() { throw new Error("denied"); } };
auth = boot(denied, denied);
assert.equal(auth.get(), "");
assert.throws(() => auth.set("FAKE_MEMORY_TOKEN"));
assert.equal(auth.get(), "FAKE_MEMORY_TOKEN");
assert.throws(() => auth.clear());
assert.equal(auth.get(), "");
console.log("✓ Token session/reload, close, remember, migration, clear, API mocks, errors and denied storage passed. No real credentials or remote writes used.");
