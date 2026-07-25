/*
 * atlas.js — Bản đồ sự kiện (toạ độ) + Niên biểu tương tác.
 * Hai chế độ chiếu:
 *   world   — equirectangular toàn cầu (world.geo.json, viewBox 360×180).
 *   vietnam — bản đồ chi tiết Việt Nam (vietnam.geo.json, 10m) gồm ĐẦY ĐỦ
 *             Hoàng Sa, Trường Sa, Phú Quốc, Côn Đảo… Hộp hiển thị
 *             Lng 101°–118°E, Lat 6.5°–23.8°N → x=(lng-101)*10, y=(23.8-lat)*10.
 * Bản đồ được HOÁN ĐỔI theo bộ lọc khu vực; pin luôn khớp phép chiếu đang dùng.
 */
(function () {
  "use strict";

  const REGION_ALIAS = { "viet nam": "vietnam", "vietnam": "vietnam", "vn": "vietnam", "the gioi": "world", "world": "world" };
  const normRegion = (v) => {
    const k = (v || "").toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return REGION_ALIAS[k] || (k === "" ? "__all__" : k);
  };
  let activeRegion = normRegion(new URLSearchParams(location.search).get("region")) || "__all__";

  let POSTS = [], FIGS = [], WORLD = null, VN = null;
  const PATH_CACHE = {};

  const historicalYear = (x) =>
    parseInt(x && (x.historical_year != null ? x.historical_year : (x.year != null ? x.year : x.born)), 10) || 0;

  async function loadFigures() {
    try { const r = await fetch("figures/index.json?_=" + Date.now()); return r.ok ? (await r.json()).figures || [] : []; }
    catch (e) { return []; }
  }
  async function loadJSON(url, dflt) { try { const r = await fetch(url); return r.ok ? await r.json() : dflt; } catch (e) { return dflt; } }

  /* ---------- Phép chiếu ---------- */
  const worldProj = (lng, lat) => ({ x: +lng + 180, y: 90 - +lat });
  const VN_ORIGIN = { lng0: 101, lat1: 23.8, scale: 10 };
  const vnProj = (lng, lat) => ({ x: (+lng - VN_ORIGIN.lng0) * VN_ORIGIN.scale, y: (VN_ORIGIN.lat1 - +lat) * VN_ORIGIN.scale });

  function ringToPath(ring, project, wrap) {
    let d = "", prev = null;
    for (const c of ring) {
      const p = project(c[0], c[1]);
      const x = p.x.toFixed(2), y = p.y.toFixed(2);
      if (wrap && prev !== null && Math.abs(c[0] - prev) > 180) d += `M${x} ${y}`;
      else d += (d === "" ? "M" : "L") + x + " " + y;
      prev = c[0];
    }
    return d + "Z";
  }

  /* ---------- Chế độ WORLD ---------- */
  function worldLandPaths() {
    if (PATH_CACHE.world) return PATH_CACHE.world;
    const toPolys = (f) => (f.t === "MultiPolygon" ? f.c : [f.c]);
    PATH_CACHE.world = (WORLD.features || [])
      .map((f) => `<path class="atlas-land" d="${toPolys(f).map((poly) => poly.map((r) => ringToPath(r, worldProj, true)).join("")).join("")}"/>`)
      .join("");
    return PATH_CACHE.world;
  }
  function worldGrid() {
    const g = [];
    for (let lng = -150; lng <= 150; lng += 30) { const x = lng + 180; g.push(`<line x1="${x}" y1="0" x2="${x}" y2="180" class="atlas-grid"/>`); }
    for (let lat = -60; lat <= 60; lat += 30) { const y = 90 - lat; g.push(`<line x1="0" y1="${y}" x2="360" y2="${y}" class="atlas-grid"/>`); }
    return g.join("");
  }
  function worldSVG(events, lang) {
    const pins = pinsSVG(events, lang, worldProj, 3.4, 1.7);
    return `<svg class="atlas-map__svg" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" role="list" aria-label="${window.I18N.t("atlas.map")}">
      <rect width="100%" height="100%" class="atlas-sea"/>
      <g class="atlas-graticule">${worldGrid()}</g>
      <g class="atlas-lands">${worldLandPaths()}</g>
      <g class="atlas-compass" transform="translate(20,158)"><circle r="9" class="atlas-compass__ring"/><path d="M0,-7 L1.9,0 L0,7 L-1.9,0 Z" class="atlas-compass__needle"/><text y="-10.5" class="atlas-compass__n">N</text></g>
      <g>${pins}</g></svg>`;
  }

  /* ---------- Chế độ VIETNAM ---------- */
  function vnGrid() {
    const g = [];
    for (let lng = 102; lng <= 117; lng += 3) { const a = vnProj(lng, 23.8), b = vnProj(lng, 6.5); g.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="atlas-grid"/>`); }
    for (let lat = 8; lat <= 22; lat += 3) { const a = vnProj(101, lat), b = vnProj(118, lat); g.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="atlas-grid"/>`); }
    return g.join("");
  }
  function vnPolyPaths(polys, cls) {
    return polys.map((poly) => `<path class="${cls}" d="${poly.map((r) => ringToPath(r, vnProj)).join("")}"/>`).join("");
  }
  function vnIslands() {
    return (VN.islands || []).map((is) => {
      const z = is.zone; // [lng0,lat0,lng1,lat1]
      const a = vnProj(z[0], z[3]), b = vnProj(z[2], z[1]);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2, rx = Math.abs(b.x - a.x) / 2, ry = Math.abs(b.y - a.y) / 2;
      const dots = is.pts.map((p) => { const q = vnProj(p[0], p[1]); return `<circle cx="${q.x.toFixed(2)}" cy="${q.y.toFixed(2)}" r="0.85" class="atlas-islet"/>`; }).join("");
      const lb = vnProj(is.label[0], is.label[1]);
      return `<g class="atlas-arch">
        <ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(rx + 1).toFixed(1)}" ry="${(ry + 1).toFixed(1)}" class="atlas-island-zone"/>
        ${dots}
        <text x="${lb.x.toFixed(1)}" y="${lb.y.toFixed(1)}" class="atlas-label atlas-label--island">${is.name}</text>
      </g>`;
    }).join("");
  }
  function vnPlaces() {
    return (VN.places || []).map((p) => {
      const q = vnProj(p.at[0], p.at[1]);
      return `<g class="atlas-place"><circle cx="${q.x.toFixed(2)}" cy="${q.y.toFixed(2)}" r="0.7" class="atlas-place__dot"/><text x="${(q.x + 1.6).toFixed(1)}" y="${(q.y + 1).toFixed(1)}" class="atlas-label">${p.name}</text></g>`;
    }).join("");
  }
  function vnSVG(events, lang) {
    const pins = pinsSVG(events, lang, vnProj, 2.6, 1.3);
    return `<svg class="atlas-map__svg atlas-map__svg--vn" viewBox="0 0 170 173" preserveAspectRatio="xMidYMid meet" role="list" aria-label="${window.I18N.t("atlas.map")}">
      <rect width="100%" height="100%" class="atlas-sea"/>
      <g class="atlas-graticule">${vnGrid()}</g>
      <g class="atlas-neighbors">${VN.neighbors.map((poly) => `<path class="atlas-land atlas-land--dim" d="${poly.map((r) => ringToPath(r, vnProj)).join("")}"/>`).join("")}</g>
      <g class="atlas-lands atlas-lands--vn">${vnPolyPaths(VN.mainland, "atlas-land atlas-land--vn")}</g>
      <g class="atlas-islands">${vnIslands()}</g>
      <g class="atlas-places">${vnPlaces()}</g>
      <g class="atlas-compass" transform="translate(14,160)"><circle r="7" class="atlas-compass__ring"/><path d="M0,-5.5 L1.5,0 L0,5.5 L-1.5,0 Z" class="atlas-compass__needle"/><text y="-8.5" class="atlas-compass__n">N</text></g>
      <g>${pins}</g></svg>`;
  }

  function pinsSVG(events, lang, project, halo, dot) {
    return events.map((e, i) => {
      const p = project(e.lng, e.lat);
      const place = Store.localized(e.place, lang);
      return `<a href="${e.url}" class="atlas-pin" role="listitem" tabindex="0" style="--d:${i * 0.08}s">
        <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${halo}" class="atlas-pin__halo"/>
        <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${dot}" class="atlas-pin__dot"/>
        <title>${Store.localized(e.title, lang)}${place ? " — " + place : ""} (${e.year})</title>
      </a>`;
    }).join("");
  }

  function timelineHTML(items, lang) {
    if (!items.length) return `<p class="empty-state">—</p>`;
    return `<div class="tl2"><div class="tl2__axis"></div>
      ${items.map((it, i) => `
        <a class="tl2__node" href="${it.url}" style="--d:${i * 0.05}s">
          <span class="tl2__year">${it.year}</span>
          <span class="tl2__dot" data-region="${it.region || ""}"></span>
          <span class="tl2__card glass"><span class="tl2__type">${it.type === "figure" ? window.I18N.t("nav.figures") : window.I18N.t("nav.blog")}</span><b>${Store.localized(it.title, lang)}</b></span>
        </a>`).join("")}
    </div>`;
  }

  function collect(lang) {
    const evPosts = POSTS
      .filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({ type: "post", url: `post.html?slug=${encodeURIComponent(p.slug)}`, title: p.title, place: p.place, year: p.year, region: p.region, lat: p.lat, lng: p.lng }))
      .sort((a, b) => historicalYear(a) - historicalYear(b));
    const tl = [
      ...POSTS.map((p) => ({ type: "post", url: `post.html?slug=${encodeURIComponent(p.slug)}`, title: p.title, year: +p.year || 0, region: p.region })),
      ...FIGS.map((f) => ({ type: "figure", url: `figure.html?slug=${encodeURIComponent(f.slug)}`, title: f.name, year: +f.born || 0, region: f.region })),
    ].filter((x) => x.year).sort((a, b) => historicalYear(a) - historicalYear(b));
    return { evPosts, tl };
  }

  function draw() {
    const lang = window.I18N.lang;
    const { evPosts, tl } = collect(lang);
    const isVN = activeRegion === "vietnam" && VN;
    const mapEvents = activeRegion === "__all__" ? evPosts : evPosts.filter((e) => e.region === activeRegion);
    const tlItems = activeRegion === "__all__" ? tl : tl.filter((e) => e.region === activeRegion);
    const mapWrap = document.getElementById("atlasMap");
    const tlWrap = document.getElementById("atlasTimeline");
    if (mapWrap) mapWrap.innerHTML = isVN ? vnSVG(mapEvents, lang) : worldSVG(mapEvents, lang);
    if (tlWrap) tlWrap.innerHTML = timelineHTML(tlItems, lang);
  }

  async function render() {
    const root = document.getElementById("atlasRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    POSTS = await Store.all();
    FIGS = await loadFigures();
    WORLD = await loadJSON("assets/data/world.geo.json", { features: [] });
    VN = await loadJSON("assets/data/vietnam.geo.json", null);

    POSTS.sort((a, b) => historicalYear(a) - historicalYear(b));
    FIGS.sort((a, b) => historicalYear(a) - historicalYear(b));

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
