/*
 * figures.js — trang "Nhân vật Lịch sử": tải figures/index.json,
 * gom nhóm theo khu vực (Việt Nam / Thế giới) và render thẻ chân dung kính lỏng.
 *
 * Hỗ trợ bộ nhớ đệm tức thời (optimistic cache) cho nhân vật mới đăng.
 */
(function () {
  "use strict";
  const LOCAL_FIGS_KEY = "hw_pending_figures";
  const LOCAL_FIG_CONTENT_KEY = "hw_pending_fig_content";
  const LOCAL_FIG_TS_KEY = "hw_pending_fig_ts";
  const PENDING_TTL = 10 * 60 * 1000;
  let cache = null;

  /* ---------- Optimistic local storage helpers ---------- */
  function getPending() {
    try {
      const ts = parseInt(localStorage.getItem(LOCAL_FIG_TS_KEY) || "0", 10);
      if (Date.now() - ts > PENDING_TTL) { clearPending(); return []; }
      return JSON.parse(localStorage.getItem(LOCAL_FIGS_KEY) || "[]");
    } catch (e) { return []; }
  }
  function savePending(items) {
    try {
      localStorage.setItem(LOCAL_FIGS_KEY, JSON.stringify(items));
      localStorage.setItem(LOCAL_FIG_TS_KEY, String(Date.now()));
    } catch (e) {}
  }
  function clearPending() {
    try {
      localStorage.removeItem(LOCAL_FIGS_KEY);
      localStorage.removeItem(LOCAL_FIG_CONTENT_KEY);
      localStorage.removeItem(LOCAL_FIG_TS_KEY);
    } catch (e) {}
  }
  function getLocalContent() {
    try { return JSON.parse(localStorage.getItem(LOCAL_FIG_CONTENT_KEY) || "{}"); } catch (e) { return {}; }
  }
  function saveLocalContent(map) {
    try { localStorage.setItem(LOCAL_FIG_CONTENT_KEY, JSON.stringify(map)); } catch (e) {}
  }

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

  async function loadFigures() {
    if (cache) return cache;
    try {
      const res = await fetch("figures/index.json?_=" + Date.now());
      let list = res.ok ? (await res.json()).figures || [] : [];
      list = mergeWithPending(list);
      cache = list;
    } catch (e) {
      const pending = getPending();
      cache = pending.length ? pending : [];
    }
    return cache;
  }
  window.loadFigures = loadFigures;

  /* API cho admin: thêm nhân vật tức thời */
  function _addLocalFigure(item) {
    const pending = getPending();
    const idx = pending.findIndex((x) => x.slug === item.slug);
    if (idx >= 0) pending[idx] = { ...pending[idx], ...item };
    else pending.push(item);
    savePending(pending);
    if (cache) {
      const ci = cache.findIndex((x) => x.slug === item.slug);
      if (ci >= 0) cache[ci] = { ...cache[ci], ...item };
      else cache.push(item);
    }
  }
  function _addLocalFigContent(slug, text) {
    const map = getLocalContent();
    map[slug] = text;
    saveLocalContent(map);
  }
  function _removeLocalFigure(slug) {
    const pending = getPending().filter((x) => x.slug !== slug);
    savePending(pending);
    const map = getLocalContent();
    delete map[slug];
    saveLocalContent(map);
    if (cache) cache = cache.filter((x) => x.slug !== slug);
  }
  function _resetFigures() { cache = null; }

  window._addLocalFigure = _addLocalFigure;
  window._addLocalFigContent = _addLocalFigContent;
  window._removeLocalFigure = _removeLocalFigure;
  window._resetFigures = _resetFigures;
  window._clearPendingFigures = clearPending;

  // Chân dung dự phòng: chữ cái đầu bằng vàng trên nền rượu vang
  window.figureFallback = function (name) {
    const initials = (name || "?").trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
    return window.hwPlaceholder(initials, 600, 680);
  };

  function cardHTML(f, lang) {
    const name = Store.localized(f.name, lang);
    const role = Store.localized(f.role, lang);
    const excerpt = Store.localized(f.excerpt, lang);
    const life = `${f.born || "?"} – ${f.died || ""}`;
    const fb = window.figureFallback(name);
    return `
    <article class="figure-card glass" data-tilt>
      <a class="figure-card__media" href="figure.html?slug=${encodeURIComponent(f.slug)}">
        <span class="figure-card__life">${life}</span>
        <img src="${f.portrait || fb}" alt="${name}" loading="lazy"
             data-fallback="${window.hwFallback(f.portrait, fb)}">
        <div class="figure-card__cap">
          <h3>${name}</h3>
          <div class="figure-card__role">${role}</div>
        </div>
      </a>
      <div class="figure-card__body">
        <p class="figure-card__excerpt">${excerpt}</p>
        <a class="figure-card__link" href="figure.html?slug=${encodeURIComponent(f.slug)}">
          <span>${window.I18N.t("figures.analyze")}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </div>
    </article>`;
  }

  function groupHTML(titleKey, list, lang) {
    if (!list.length) return "";
    return `
      <div class="figures-group" data-reveal>
        <div class="figures-group__head">
          <h2>${window.I18N.t(titleKey)}</h2>
          <span class="figures-group__count">${list.length}</span>
        </div>
        <div class="figures-grid" data-stagger>
          ${list.map((f) => cardHTML(f, lang)).join("")}
        </div>
      </div>`;
  }

  async function render() {
    const root = document.getElementById("figuresRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    const figures = await loadFigures();
    const vn = figures.filter((f) => f.region === "vietnam");
    const world = figures.filter((f) => f.region === "world");

    root.innerHTML = figures.length
      ? groupHTML("figures.group.vn", vn, lang) + groupHTML("figures.group.world", world, lang)
      : `<p class="empty-state">${window.I18N.t("figures.empty")}</p>`;

    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
