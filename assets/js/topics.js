/*
 * topics.js — trang Chủ đề (tag hub).
 *  - Không có ?tag=  → lưới tất cả chủ đề (kèm số lượng bài + nhân vật).
 *  - Có ?tag=X       → tổng hợp mọi bài viết & nhân vật thuộc chủ đề X.
 */
(function () {
  "use strict";

  async function loadFigures() {
    try { const r = await fetch("figures/index.json?_=" + Date.now()); return r.ok ? (await r.json()).figures || [] : []; }
    catch (e) { return []; }
  }
  function figFallback(name) {
    const initials = (name || "?").trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
    return window.hwPlaceholder(initials, 600, 680);
  }
  const postFallback = (year) => window.hwPlaceholder(year || "H", 800, 500);

  function postCard(p, lang) {
    const title = Store.localized(p.title, lang);
    const fb = postFallback(p.year);
    return `
    <article class="card" data-reveal>
      <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="card__media">
        ${p.year ? `<span class="card__year">${p.year}</span>` : ""}
        <img src="${p.cover || fb}" alt="${title}" loading="lazy" data-fallback="${window.hwFallback(p.cover, fb)}">
      </a>
      <div class="card__body">
        <div class="card__tags">${(p.tags || []).slice(0, 3).map((t) => `<a class="tag" href="topics.html?tag=${encodeURIComponent(t)}">${t}</a>`).join("")}</div>
        <h3 class="card__title"><a href="post.html?slug=${encodeURIComponent(p.slug)}">${title}</a></h3>
        <p class="card__excerpt">${Store.localized(p.excerpt, lang)}</p>
        <div class="card__meta"><span>${window.fmtDate(p.date, lang)}</span></div>
      </div>
    </article>`;
  }
  function figCard(f, lang) {
    const name = Store.localized(f.name, lang);
    const fb = figFallback(name);
    return `
    <article class="figure-card glass" data-tilt>
      <a class="figure-card__media" href="figure.html?slug=${encodeURIComponent(f.slug)}">
        <span class="figure-card__life">${f.born || "?"} – ${f.died || ""}</span>
        <img src="${f.portrait || fb}" alt="${name}" loading="lazy" data-fallback="${window.hwFallback(f.portrait, fb)}">
        <div class="figure-card__cap"><h3>${name}</h3><div class="figure-card__role">${Store.localized(f.role, lang)}</div></div>
      </a>
      <div class="figure-card__body">
        <p class="figure-card__excerpt">${Store.localized(f.excerpt, lang)}</p>
        <a class="figure-card__link" href="figure.html?slug=${encodeURIComponent(f.slug)}"><span>${window.I18N.t("figures.analyze")}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
      </div>
    </article>`;
  }

  async function render() {
    const root = document.getElementById("topicsRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    const tag = new URLSearchParams(location.search).get("tag");
    const posts = await Store.all();
    const figures = await loadFigures();

    if (tag) return renderTopic(root, lang, tag, posts, figures);

    // Lưới tất cả chủ đề
    const counts = {};
    posts.forEach((p) => (p.tags || []).forEach((t) => (counts[t] = counts[t] || { posts: 0, figures: 0 }, counts[t].posts++)));
    figures.forEach((f) => (f.tags || []).forEach((t) => (counts[t] = counts[t] || { posts: 0, figures: 0 }, counts[t].figures++)));
    const topics = Object.keys(counts).sort((a, b) => (counts[b].posts + counts[b].figures) - (counts[a].posts + counts[a].figures));

    document.title = window.I18N.t("topics.title") + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");
    root.innerHTML = `
      <section class="page-hero">
        <div class="aurora" aria-hidden="true"><span class="aurora__blob aurora__blob--1"></span><span class="aurora__blob aurora__blob--2"></span><span class="aurora__blob aurora__blob--3"></span></div>
        <div class="wrap" data-reveal style="position:relative;z-index:1">
          <span class="kicker" data-i18n="topics.kicker">${window.I18N.t("topics.kicker")}</span>
          <h1 data-i18n="topics.title">${window.I18N.t("topics.title")}</h1>
          <p data-i18n="topics.subtitle">${window.I18N.t("topics.subtitle")}</p>
        </div>
      </section>
      <section class="section"><div class="wrap">
        <div class="topics-grid" data-stagger>
          ${topics.map((t) => {
            const c = counts[t]; const total = c.posts + c.figures;
            return `<a class="topic-tile glass" href="topics.html?tag=${encodeURIComponent(t)}" data-tilt>
              <span class="topic-tile__name">${t}</span>
              <span class="topic-tile__count">${total} ${window.I18N.t("topics.count")}</span>
              <span class="topic-tile__break">${c.posts ? `${c.posts} · ${window.I18N.t("topic.posts")}` : ""}${c.posts && c.figures ? " · " : ""}${c.figures ? `${c.figures} · ${window.I18N.t("topic.figures")}` : ""}</span>
            </a>`;
          }).join("")}
        </div>
      </div></section>`;
    if (window.hwReveal) window.hwReveal();
  }

  function renderTopic(root, lang, tag, posts, figures) {
    const tp = posts.filter((p) => (p.tags || []).includes(tag));
    const tf = figures.filter((f) => (f.tags || []).includes(tag));
    document.title = tag + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");
    root.innerHTML = `
      <section class="page-hero">
        <div class="aurora" aria-hidden="true"><span class="aurora__blob aurora__blob--1"></span><span class="aurora__blob aurora__blob--2"></span></div>
        <div class="wrap" data-reveal style="position:relative;z-index:1">
          <a href="topics.html" class="kicker" style="color:var(--gold-soft)">← ${window.I18N.t("topic.back")}</a>
          <h1 style="margin-top:.6rem">#${tag}</h1>
        </div>
      </section>
      <section class="section"><div class="wrap">
        ${tp.length ? `<div class="section-head" data-reveal><span class="kicker">${window.I18N.t("topic.posts")}</span></div>
          <div class="grid" data-stagger>${tp.map((p) => postCard(p, lang)).join("")}</div>` : ""}
        ${tf.length ? `<div class="section-head" data-reveal style="margin-top:3rem"><span class="kicker">${window.I18N.t("topic.figures")}</span></div>
          <div class="figures-grid" data-stagger>${tf.map((f) => figCard(f, lang)).join("")}</div>` : ""}
        ${!tp.length && !tf.length ? `<p class="empty-state">${window.I18N.t("topic.empty")}</p>` : ""}
      </div></section>`;
    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
