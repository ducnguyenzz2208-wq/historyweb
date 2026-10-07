/* Token storage is scoped to this tab by default; persistence is explicit. */
window.AdminToken = (function () {
  "use strict";
  const KEY = "hw_gh_token";
  const CONSENT = "hw_gh_token_remember";
  const read = (storage) => { try { return window[storage].getItem(KEY) || ""; } catch (_) { return ""; } };
  const remove = (storage) => { try { window[storage].removeItem(KEY); return true; } catch (_) { return false; } };
  let value = read("sessionStorage");
  const legacy = read("localStorage");
  let persistent = false;
  try { persistent = window.localStorage.getItem(CONSENT) === "1"; } catch (_) {}
  let migrated = false;
  // Old versions saved without consent. Move only our own key to the session.
  if (legacy && !persistent) {
    value = value || legacy;
    try { window.sessionStorage.setItem(KEY, value); } catch (_) {}
    migrated = remove("localStorage");
  }
  if (legacy && persistent) value = legacy;
  return {
    get: () => value,
    get migrated() { return migrated; },
    get persistent() { return persistent; },
    set(token, remember = false) {
      value = String(token || "").trim();
      if (!value) return this.clear();
      if (!remove("localStorage")) throw new Error("Cannot clear persistent token storage.");
      try {
        window.sessionStorage.setItem(KEY, value);
        window.localStorage.removeItem(CONSENT);
        if (remember) {
          window.localStorage.setItem(KEY, value);
          window.localStorage.setItem(CONSENT, "1");
        }
        persistent = !!remember;
      } catch (_) {
        remove("localStorage");
        try { window.localStorage.removeItem(CONSENT); } catch (_) {}
        persistent = false;
        throw new Error("Token is available in memory, but browser storage is unavailable.");
      }
    },
    clear() {
      value = ""; persistent = false;
      const local = remove("localStorage"), session = remove("sessionStorage");
      try { window.localStorage.removeItem(CONSENT); } catch (_) {}
      if (!local || !session) throw new Error("Token cleared from memory; browser storage could not be cleared.");
    },
    async request(path, opts = {}) {
      if (!value) throw new Error("No GitHub token saved for this session.");
      if (!/^\/(?:user(?:\?|$)|repos\/)/.test(path) || /[\r\n]/.test(path)) throw new Error("Invalid GitHub API path.");
      const res = await fetch("https://api.github.com" + path, {
        ...opts, cache: "no-store", redirect: "error",
        headers: { ...(opts.headers || {}), Authorization: "Bearer " + value,
          Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
      });
      if (!res.ok) {
        // Do not display API response bodies that could contain private content.
        const err = new Error(`GitHub API: HTTP ${res.status}`); err.status = res.status; throw err;
      }
      return res.status === 204 ? null : res.json();
    },
  };
})();
