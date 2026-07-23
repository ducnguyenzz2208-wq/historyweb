/*
 * store.js — tải và cung cấp dữ liệu bài viết từ posts/index.json.
 * Mỗi bài: { slug, title{vi,en}, excerpt{vi,en}, year, date, tags[], cover, lang, file, featured }
 *
 * Hỗ trợ bộ nhớ đệm tức thời (optimistic cache): sau khi đăng bài trên admin,
 * bài mới xuất hiện ngay trên blog/trang chủ mà không cần chờ Vercel deploy lại.
 */
window.Store = (function () {
  "use strict";
  const LOCAL_POSTS_KEY = "hw_pending_posts";
  const LOCAL_CONTENT_KEY = "hw_pending_content";
  const LOCAL_TS_KEY = "hw_pending_ts";
  const PENDING_TTL = 10 * 60 * 1000; // 10 phút — đủ thời gian cho Vercel deploy
  let cache = null;

  /* ---------- Optimistic local storage helpers ---------- */
  function getPending() {
    try {
      const ts = parseInt(localStorage.getItem(LOCAL_TS_KEY) || "0", 10);
      if (Date.now() - ts > PENDING_TTL) { clearPending(); return []; }
      return JSON.parse(localStorage.getItem(LOCAL_POSTS_KEY) || "[]");
    } catch (e) { return []; }
  }
  function savePending(items) {
    try {
      localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(items));
      localStorage.setItem(LOCAL_TS_KEY, String(Date.now()));
    } catch (e) {}
  }
  function clearPending() {
    try {
      localStorage.removeItem(LOCAL_POSTS_KEY);
      localStorage.removeItem(LOCAL_CONTENT_KEY);
      localStorage.removeItem(LOCAL_TS_KEY);
    } catch (e) {}
  }
  function getLocalContent() {
    try { return JSON.parse(localStorage.getItem(LOCAL_CONTENT_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveLocalContent(map) {
    try { localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(map)); } catch (e) {}
  }

  /* Ghép bài pending vào danh sách server, ưu tiên bản local (mới hơn) */
  function mergeWithPending(serverList) {
    const pending = getPending();
    if (!pending.length) return serverList;
    const merged = serverList.slice();
    for (const p of pending) {
      const idx = merged.findIndex((x) => x.slug === p.slug);
      if (idx >= 0) merged[idx] = { ...merged[idx], ...p };
      else merged.push(p);
    }
    return merged;
  }

  async function all() {
    if (cache) return cache;
    try {
      const res = await fetch("posts/index.json?_=" + Date.now());
      if (!res.ok) throw new Error("index.json " + res.status);
      const data = await res.json();
      let list = data.posts || [];
      list = mergeWithPending(list);
      cache = list.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    } catch (e) {
      console.warn("Không tải được posts/index.json", e);
      // Nếu offline, dùng pending posts
      const pending = getPending();
      cache = pending.length ? pending.slice().sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
    }
    return cache;
  }

  async function bySlug(slug) {
    const list = await all();
    return list.find((p) => p.slug === slug) || null;
  }

  async function content(post) {
    if (!post || !post.file) return "";
    // Ưu tiên nội dung local (vừa đăng) trước khi fetch server
    const localMap = getLocalContent();
    if (localMap[post.slug]) return localMap[post.slug];
    try {
      const res = await fetch(post.file + "?_=" + Date.now());
      if (!res.ok) throw new Error(res.status);
      return await res.text();
    } catch (e) {
      return "";
    }
  }

  function localized(field, lang) {
    if (!field) return "";
    if (typeof field === "string") return field;
    return field[lang] || field.vi || field.en || Object.values(field)[0] || "";
  }

  function allTags(list) {
    const set = new Set();
    list.forEach((p) => (p.tags || []).forEach((t) => set.add(t)));
    return [...set];
  }

  function readTime(text, lang) {
    const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  }

  /* ---------- API cho admin: thêm bài tức thời ---------- */
  function _addLocal(item) {
    const pending = getPending();
    const idx = pending.findIndex((x) => x.slug === item.slug);
    if (idx >= 0) pending[idx] = { ...pending[idx], ...item };
    else pending.push(item);
    savePending(pending);
    // Cập nhật cache in-memory nếu đã tải
    if (cache) {
      const ci = cache.findIndex((x) => x.slug === item.slug);
      if (ci >= 0) cache[ci] = { ...cache[ci], ...item };
      else cache.push(item);
      cache.sort((a, b) => (a.date < b.date ? 1 : -1));
    }
  }

  function _addLocalContent(slug, text) {
    const map = getLocalContent();
    map[slug] = text;
    saveLocalContent(map);
  }

  function _removeLocal(slug) {
    const pending = getPending().filter((x) => x.slug !== slug);
    savePending(pending);
    const map = getLocalContent();
    delete map[slug];
    saveLocalContent(map);
    if (cache) {
      cache = cache.filter((x) => x.slug !== slug);
    }
  }

  return {
    all, bySlug, content, localized, allTags, readTime,
    _reset: () => (cache = null),
    _addLocal, _addLocalContent, _removeLocal, _clearPending: clearPending,
  };
})();

/* Định dạng ngày theo ngôn ngữ */
window.fmtDate = function (iso, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { year: "numeric", month: "long", day: "numeric" });
};
