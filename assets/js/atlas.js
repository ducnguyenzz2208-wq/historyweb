/*
 * atlas.js — Bản đồ sự kiện (toạ độ) + Niên biểu tương tác.
 * Bản đồ dùng phép chiếu equirectangular: x = lng + 180, y = 90 - lat (viewBox 360×180).
 * Lục địa vẽ cách điệu theo phong cách bản đồ cổ (đúng vị trí tương đối để cắm ghim chuẩn).
 */
(function () {
  "use strict";
  let activeRegion = "__all__";
  let POSTS = [], FIGS = [], WORLD = null, WORLD_PATHS = "";

  async function loadFigures() {
    try { const r = await fetch("figures/index.json?_=" + Date.now()); return r.ok ? (await r.json()).figures || [] : []; }
    catch (e) { return []; }
  }
  // Bản đồ thế giới thật (GeoJSON đã rút gọn) — phép chiếu equirectangular
  async function loadWorld() {
    if (WORLD) return WORLD;
    try { const r = await fetch("assets/data/world.geo.json"); WORLD = r.ok ? await r.json() : { features: [] }; }
    catch (e) { WORLD = { features: [] }; }
    return WORLD;
  }

  const proj = (lng, lat) => ({ x: +lng + 180, y: 90 - +lat });

  // Chuyển một vòng toạ độ [lng,lat] thành đường SVG, cắt khi vượt kinh tuyến 180
  function ringToPath(ring) {
    let d = "", prevLng = null;
    for (let i = 0; i < ring.length; i++) {
      const lng = ring[i][0], lat = ring[i][1];
      const x = (lng + 180).toFixed(2), y = (90 - lat).toFixed(2);
      if (prevLng !== null && Math.abs(lng - prevLng) > 180) d += `M${x} ${y}`; // ngắt ở antimeridian
      else d += (d === "" ? "M" : "L") + x + " " + y;
      prevLng = lng;
    }
    return d + "Z";
  }
  function featurePath(f) {
    const polys = f.t === "MultiPolygon" ? f.c : [f.c];
    return polys.map((poly) => poly.map(ringToPath).join("")).join("");
  }
  function buildWorldPaths() {
    if (WORLD_PATHS) return WORLD_PATHS;
    WORLD_PATHS = (WORLD.features || []).map((f) => `<path class="atlas-land" d="${featurePath(f)}"/>`).join("");
    return WORLD_PATHS;
  }

  function mapSVG(events, lang) {
    const grid = [];
    for (let lng = -150; lng <= 150; lng += 30) { const x = lng + 180; grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="180" class="atlas-grid"/>`); }
    for (let lat = -60; lat <= 60; lat += 30) { const y = 90 - lat; grid.push(`<line x1="0" y1="${y}" x2="360" y2="${y}" class="atlas-grid"/>`); }
    const pins = events.map((e, i) => {
      const p = proj(e.lng, e.lat);
      const place = Store.localized(e.place, lang);
      return `<a href="${e.url}" class="atlas-pin" role="listitem" tabindex="0" style="--d:${i * 0.08}s">
        <circle cx="${p.x}" cy="${p.y}" r="3.4" class="atlas-pin__halo"/>
        <circle cx="${p.x}" cy="${p.y}" r="1.7" class="atlas-pin__dot"/>
        <title>${Store.localized(e.title, lang)}${place ? " — " + place : ""} (${e.year})</title>
      </a>`;
    }).join("");
    return `
      <svg class="atlas-map__svg" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="list" aria-label="${window.I18N.t("atlas.map")}">
        <rect x="0" y="0" width="360" height="180" class="atlas-sea"/>
        <g class="atlas-graticule">${grid.join("")}</g>
        <g class="atlas-lands">${buildWorldPaths()}</g>
        <g class="atlas-compass" transform="translate(20,158)">
          <circle r="9" class="atlas-compass__ring"/>
          <path d="M0,-7 L1.9,0 L0,7 L-1.9,0 Z" class="atlas-compass__needle"/>
          <text y="-10.5" class="atlas-compass__n">N</text>
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
    await loadWorld();
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
