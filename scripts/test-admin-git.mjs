/* Exercise the real Git Data helpers with a mock API; never upload test articles. */
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const source = fs.readFileSync("assets/js/admin.js", "utf8");
const prefix = source.slice(0, source.indexOf("  /* ---------- status ---------- */"));
function boot(request) {
  const window = { SITE_CONFIG: { repoOwner: "mock-owner", repoName: "historyweb", branch: "main" }, AdminToken: { get: () => "FAKE_TOKEN", request } };
  vm.runInNewContext(prefix + "window.testGit = { getFile, commitFiles }; })();", { window, document: {}, btoa: s => Buffer.from(s, "binary").toString("base64"), atob: s => Buffer.from(s, "base64").toString("binary") });
  return window.testGit;
}
for (const status of [401, 403, 409, 500]) {
  const git = boot(async () => { const error = new Error(`HTTP ${status}`); error.status = status; throw error; });
  await assert.rejects(git.getFile("posts/index.json"), error => error.status === status);
}
assert.equal(await boot(async () => { const error = new Error("missing"); error.status = 404; throw error; }).getFile("missing.md"), null);
const calls = [];
const git = boot(async (path, options = {}) => {
  calls.push({ path, options });
  if (path.endsWith('/git/ref/heads/main')) return { object: { sha: "BASE_COMMIT" } };
  if (path.endsWith('/git/commits/BASE_COMMIT')) return { tree: { sha: "BASE_TREE" } };
  if (path.endsWith('/git/blobs')) return { sha: "BLOB_" + calls.length };
  if (path.endsWith('/git/trees')) return { sha: "NEW_TREE" };
  if (path.endsWith('/git/commits')) return { sha: "NEW_COMMIT" };
  if (path.endsWith('/git/refs/heads/main')) return {};
  throw new Error('Unexpected mock API path');
});
assert.equal(await git.commitFiles([], "empty"), null);
assert.equal(calls.length, 0);
const files = [{ path: "posts/mock.vi.md", content: "# Mock VI" }, { path: "posts/mock.en.md", content: "# Mock EN" }, { path: "assets/uploads/mock.png", content: "aGVsbG8=", encoding: "base64" }, { path: "posts/index.json", content: '{"posts":[]}' }];
assert.equal(await git.commitFiles(files, "mock publication"), "NEW_COMMIT");
assert.equal(calls.filter(c => c.path.endsWith('/git/commits') && c.options.method === 'POST').length, 1);
const tree = JSON.parse(calls.find(c => c.path.endsWith('/git/trees')).options.body);
assert.equal(tree.base_tree, "BASE_TREE");
assert.deepEqual(tree.tree.map(e => e.path), files.map(f => f.path));
const commit = JSON.parse(calls.find(c => c.path.endsWith('/git/commits')).options.body);
assert.deepEqual(commit.parents, ["BASE_COMMIT"]);
const ref = JSON.parse(calls.at(-1).options.body);
assert.equal(ref.sha, "NEW_COMMIT");
assert.notEqual(ref.force, true);
console.log("✓ Auth/network errors preserve the index; bilingual bodies + image + index use one non-forced mock commit.");
