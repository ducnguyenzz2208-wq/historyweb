/*
 * store.js — tải và cung cấp dữ liệu bài viết từ posts/index.json.
 * Mỗi bài: { slug, title{vi,en}, excerpt{vi,en}, year, date, tags[], cover, lang, file, featured }
 */
window.Store = (function () {
  "use strict";
  let cache = null;

  async function all() {
    if (cache) return cache;
    try {
      const res = await fetch("posts/index.json?_=" + Date.now());
      if (!res.ok) throw new Error("index.json " + res.status);
      const data = await res.json();
      cache = (data.posts || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
    } catch (e) {
      console.warn("Không tải được posts/index.json", e);
      cache = [];
    }
    return cache;
  }

  async function bySlug(slug) {
    const list = await all();
    return list.find((p) => p.slug === slug) || null;
  }

  async function content(post) {
    if (!post || !post.file) return "";
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

  return { all, bySlug, content, localized, allTags, readTime, _reset: () => (cache = null) };
})();

/* Định dạng ngày theo ngôn ngữ */
window.fmtDate = function (iso, lang) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { year: "numeric", month: "long", day: "numeric" });
};
