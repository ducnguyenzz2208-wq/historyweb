/*
 * atlas.js — Bản đồ sự kiện (toạ độ) + Niên biểu tương tác.
 * Bản đồ dùng phép chiếu equirectangular: x = lng + 180, y = 90 - lat (viewBox 360×180).
 * Lục địa vẽ cách điệu theo phong cách bản đồ cổ (đúng vị trí tương đối để cắm ghim chuẩn).
 */
(function () {
  "use strict";
  let activeRegion = "__all__";
  let POSTS = [], FIGS = [];

  async function loadFigures() {
    try { const r = await fetch("figures/index.json?_=" + Date.now()); return r.ok ? (await r.json()).figures || [] : []; }
    catch (e) { return []; }
  }

  // Lục địa cách điệu (ellipse ở toạ độ equirectangular gần đúng)
  const CONTINENTS = [
    { lng: -100, lat: 45, rx: 34, ry: 22, label: "Bắc Mỹ" },
    { lng: -60, lat: -18, rx: 17, ry: 28, label: "Nam Mỹ" },
    { lng: 16, lat: 50, rx: 19, ry: 12, label: "Âu" },
    { lng: 20, lat: 2, rx: 26, ry: 34, label: "Phi" },
    { lng: 92, lat: 46, rx: 46, ry: 26, label: "Á" },
    { lng: 134, lat: -25, rx: 15, ry: 10, label: "Úc" },
  ];

  const proj = (lng, lat) => ({ x: +lng + 180, y: 90 - +lat });

  function mapSVG(events, lang) {
    const grid = [];
    for (let lng = -180; lng <= 180; lng += 30) { const x = lng + 180; grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="180" class="atlas-grid"/>`); }
    for (let lat = -60; lat <= 60; lat += 30) { const y = 90 - lat; grid.push(`<line x1="0" y1="${y}" x2="360" y2="${y}" class="atlas-grid"/>`); }
    const conts = CONTINENTS.map((c) => { const p = proj(c.lng, c.lat); return `<ellipse cx="${p.x}" cy="${p.y}" rx="${c.rx}" ry="${c.ry}" class="atlas-land"/>`; }).join("");
    const contLabels = CONTINENTS.map((c) => { const p = proj(c.lng, c.lat); return `<text x="${p.x}" y="${p.y}" class="atlas-land-label">${c.label}</text>`; }).join("");
    const pins = events.map((e, i) => {
      const p = proj(e.lng, e.lat);
      const place = Store.localized(e.place, lang);
      return `<a href="${e.url}" class="atlas-pin" role="listitem" tabindex="0" style="--d:${i * 0.08}s">
        <circle cx="${p.x}" cy="${p.y}" r="4.2" class="atlas-pin__halo"/>
        <circle cx="${p.x}" cy="${p.y}" r="2.1" class="atlas-pin__dot"/>
        <title>${Store.localized(e.title, lang)}${place ? " — " + place : ""} (${e.year})</title>
      </a>`;
    }).join("");
    return `
      <svg class="atlas-map__svg" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="list" aria-label="${window.I18N.t("atlas.map")}">
        <rect x="0" y="0" width="360" height="180" class="atlas-sea"/>
        <g>${grid.join("")}</g>
        <g>${conts}</g>
        <g>${contLabels}</g>
        <g class="atlas-compass" transform="translate(26,150)">
          <circle r="11" class="atlas-compass__ring"/>
          <path d="M0,-9 L2.4,0 L0,9 L-2.4,0 Z" class="atlas-compass__needle"/>
          <text y="-13" class="atlas-compass__n">B</text>
        </g>
        <g>${pins}</g>
      </svg>`;
  }

  function timelineHTML(items, lang) {
    if (!items.length) return `<p class="empty-state">—</p>`;
    return `<div class="tl2">
      <div class="tl2__axis"></div>
      ${items.map((it, i) => `
        <a class="tl2__node" href="${it.url}" style="--d:${i * 0.05}s">
          <span class="tl2__year">${it.year}</span>
          <span class="tl2__dot" data-region="${it.region || ""}"></span>
          <span class="tl2__card glass">
            <span class="tl2__type">${it.type === "figure" ? window.I18N.t("nav.figures") : window.I18N.t("nav.blog")}</span>
            <b>${Store.localized(it.title, lang)}</b>
          </span>
        </a>`).join("")}
    </div>`;
  }

  function collect(lang) {
    const evPosts = POSTS.filter((p) => p.lat != null && p.lng != null).map((p) => ({
      type: "post", url: `post.html?slug=${encodeURIComponent(p.slug)}`, title: p.title,
      place: p.place, year: p.year, region: p.region, lat: p.lat, lng: p.lng,
    }));
    // niên biểu: bài viết + nhân vật, sắp theo năm
    const tl = [
      ...POSTS.map((p) => ({ type: "post", url: `post.html?slug=${encodeURIComponent(p.slug)}`, title: p.title, year: +p.year || 0, region: p.region })),
      ...FIGS.map((f) => ({ type: "figure", url: `figure.html?slug=${encodeURIComponent(f.slug)}`, title: f.name, year: +f.born || 0, region: f.region })),
    ].filter((x) => x.year).sort((a, b) => a.year - b.year);
    return { evPosts, tl };
  }

  function draw() {
    const lang = window.I18N.lang;
    const { evPosts, tl } = collect(lang);
    const mapEvents = activeRegion === "__all__" ? evPosts : evPosts.filter((e) => e.region === activeRegion);
    const tlItems = activeRegion === "__all__" ? tl : tl.filter((e) => e.region === activeRegion);
    const mapWrap = document.getElementById("atlasMap");
    const tlWrap = document.getElementById("atlasTimeline");
    if (mapWrap) mapWrap.innerHTML = mapSVG(mapEvents, lang);
    if (tlWrap) tlWrap.innerHTML = timelineHTML(tlItems, lang);
  }

  async function render() {
    const root = document.getElementById("atlasRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    POSTS = await Store.all();
    FIGS = await loadFigures();
    document.title = window.I18N.t("atlas.title") + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");

    const regions = [["__all__", window.I18N.t("atlas.all")], ["vietnam", window.I18N.t("region.vietnam")], ["world", window.I18N.t("region.world")]];
    root.innerHTML = `
      <section class="page-hero">
        <div class="aurora" aria-hidden="true"><span class="aurora__blob aurora__blob--1"></span><span class="aurora__blob aurora__blob--2"></span><span class="aurora__blob aurora__blob--3"></span></div>
        <div class="wrap" data-reveal style="position:relative;z-index:1">
          <span class="kicker">${window.I18N.t("atlas.kicker")}</span>
          <h1>${window.I18N.t("atlas.title")}</h1>
          <p>${window.I18N.t("atlas.subtitle")}</p>
        </div>
      </section>

      <section class="section"><div class="wrap">
        <div class="center" style="margin-bottom:1.6rem" data-reveal>
          <div class="segmented glass" id="atlasSeg">
            ${regions.map(([v, l]) => `<button data-region="${v}" class="${v === activeRegion ? "active" : ""}">${l}</button>`).join("")}
          </div>
        </div>

        <div class="section-head" data-reveal><span class="kicker">${window.I18N.t("atlas.map")}</span></div>
        <div class="atlas-map glass" id="atlasMap" data-reveal></div>

        <div class="section-head" data-reveal style="margin-top:3.5rem"><span class="kicker">${window.I18N.t("atlas.timeline")}</span></div>
        <div id="atlasTimeline" data-reveal></div>
      </div></section>`;

    draw();
    const seg = document.getElementById("atlasSeg");
    if (seg) seg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-region]"); if (!b) return;
      activeRegion = b.dataset.region;
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      draw();
    });
    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
