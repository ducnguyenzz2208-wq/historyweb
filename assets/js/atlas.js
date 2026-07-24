/*
 * atlas.js — Bản đồ sự kiện (toạ độ) + Niên biểu tương tác.
 * Hai chế độ chiếu:
 *   world   — equirectangular toàn cầu: x = lng + 180, y = 90 - lat (viewBox 360×180)
 *   vietnam — phóng vào Việt Nam (gồm Hoàng Sa/Trường Sa):
 *             bbox Lng 102°–115°E, Lat 8.5°–23.5°N, tỉ lệ 10 đơn vị/độ
 *             x = (lng - 102) * 10 ; y = (23.5 - lat) * 10  (viewBox 130×150)
 * Bản đồ được HOÁN ĐỔI theo bộ lọc khu vực; toạ độ pin luôn khớp phép chiếu đang dùng.
 */
(function () {
  "use strict";

  // Khu vực khởi đầu: đọc từ URL (?region=vietnam | "Việt Nam" | world | all)
  const REGION_ALIAS = { "viet nam": "vietnam", "vietnam": "vietnam", "vn": "vietnam", "the gioi": "world", "world": "world" };
  const normRegion = (v) => {
    const k = (v || "").toString().trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return REGION_ALIAS[k] || (k === "" ? "__all__" : k);
  };
  let activeRegion = normRegion(new URLSearchParams(location.search).get("region")) || "__all__";

  let POSTS = [], FIGS = [], WORLD = null;
  const PATH_CACHE = {}; // { world: "<path…>", vietnam: "<path…>" }

  /* Năm lịch sử (số nguyên) — dùng để sắp xếp theo dòng thời gian. */
  const historicalYear = (x) =>
    parseInt(x && (x.historical_year != null ? x.historical_year : (x.year != null ? x.year : x.born)), 10) || 0;

  async function loadFigures() {
    try { const r = await fetch("figures/index.json?_=" + Date.now()); return r.ok ? (await r.json()).figures || [] : []; }
    catch (e) { return []; }
  }
  async function loadWorld() {
    if (WORLD) return WORLD;
    try { const r = await fetch("assets/data/world.geo.json"); WORLD = r.ok ? await r.json() : { features: [] }; }
    catch (e) { WORLD = { features: [] }; }
    return WORLD;
  }

  /* ---------- Phép chiếu ---------- */
  const PROJ = {
    world: {
      viewBox: "0 0 360 180",
      project: (lng, lat) => ({ x: +lng + 180, y: 90 - +lat }),
      pin: { halo: 3.4, dot: 1.7 },
      compass: { t: "translate(20,158)", r: 9, needle: "M0,-7 L1.9,0 L0,7 L-1.9,0 Z", ty: -10.5 },
      // giữ lại toàn bộ lục địa
      keep: () => true,
      grid() {
        const g = [];
        for (let lng = -150; lng <= 150; lng += 30) { const x = lng + 180; g.push(`<line x1="${x}" y1="0" x2="${x}" y2="180" class="atlas-grid"/>`); }
        for (let lat = -60; lat <= 60; lat += 30) { const y = 90 - lat; g.push(`<line x1="0" y1="${y}" x2="360" y2="${y}" class="atlas-grid"/>`); }
        return g.join("");
      },
    },
    vietnam: {
      viewBox: "0 0 130 150",
      project: (lng, lat) => ({ x: (+lng - 102) * 10, y: (23.5 - +lat) * 10 }),
      pin: { halo: 2.4, dot: 1.2 },
      compass: { t: "translate(12,138)", r: 7, needle: "M0,-5.5 L1.5,0 L0,5.5 L-1.5,0 Z", ty: -8.5 },
      // chỉ vẽ lục địa quanh Việt Nam để bản đồ gọn và nét (lng 95–120, lat 3–28)
      keep: (lng, lat) => lng >= 95 && lng <= 120 && lat >= 3 && lat <= 28,
      grid() {
        const P = PROJ.vietnam.project; const g = [];
        for (let lng = 102; lng <= 114; lng += 2) { const a = P(lng, 23.5), b = P(lng, 8.5); g.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="atlas-grid"/>`); }
        for (let lat = 10; lat <= 22; lat += 2) { const a = P(102, lat), b = P(115, lat); g.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="atlas-grid"/>`); }
        return g.join("");
      },
    },
  };
  const projFor = (region) => (region === "vietnam" ? PROJ.vietnam : PROJ.world);

  /* ---------- Vẽ lục địa cho một phép chiếu ---------- */
  function ringToPath(ring, project) {
    let d = "", prevLng = null;
    for (let i = 0; i < ring.length; i++) {
      const lng = ring[i][0], lat = ring[i][1];
      const p = project(lng, lat);
      const x = p.x.toFixed(2), y = p.y.toFixed(2);
      if (prevLng !== null && Math.abs(lng - prevLng) > 180) d += `M${x} ${y}`; // cắt ở kinh tuyến 180
      else d += (d === "" ? "M" : "L") + x + " " + y;
      prevLng = lng;
    }
    return d + "Z";
  }
  const featureInBox = (f, keep) =>
    (f.t === "MultiPolygon" ? f.c.flat(1) : f.c).some((ring) => ring.some((c) => keep(c[0], c[1])));
  function featurePath(f, project) {
    const polys = f.t === "MultiPolygon" ? f.c : [f.c];
    return polys.map((poly) => poly.map((ring) => ringToPath(ring, project)).join("")).join("");
  }
  function buildLandPaths(mode) {
    if (PATH_CACHE[mode]) return PATH_CACHE[mode];
    const P = PROJ[mode];
    PATH_CACHE[mode] = (WORLD.features || [])
      .filter((f) => featureInBox(f, P.keep))
      .map((f) => `<path class="atlas-land" d="${featurePath(f, P.project)}"/>`)
      .join("");
    return PATH_CACHE[mode];
  }

  function mapSVG(events, lang, mode) {
    const P = PROJ[mode];
    const pins = events.map((e, i) => {
      const p = P.project(e.lng, e.lat);
      const place = Store.localized(e.place, lang);
      return `<a href="${e.url}" class="atlas-pin" role="listitem" tabindex="0" style="--d:${i * 0.08}s">
        <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${P.pin.halo}" class="atlas-pin__halo"/>
        <circle cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="${P.pin.dot}" class="atlas-pin__dot"/>
        <title>${Store.localized(e.title, lang)}${place ? " — " + place : ""} (${e.year})</title>
      </a>`;
    }).join("");
    return `
      <svg class="atlas-map__svg" viewBox="${P.viewBox}" preserveAspectRatio="xMidYMid meet" role="list" aria-label="${window.I18N.t("atlas.map")}">
        <rect x="0" y="0" width="100%" height="100%" class="atlas-sea"/>
        <g class="atlas-graticule">${P.grid()}</g>
        <g class="atlas-lands">${buildLandPaths(mode)}</g>
        <g class="atlas-compass" transform="${P.compass.t}">
          <circle r="${P.compass.r}" class="atlas-compass__ring"/>
          <path d="${P.compass.needle}" class="atlas-compass__needle"/>
          <text y="${P.compass.ty}" class="atlas-compass__n">N</text>
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
    // TASK 2: sắp xếp theo dòng thời gian NGAY sau khi gộp dữ liệu, trước khi vẽ.
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
    const mode = activeRegion === "vietnam" ? "vietnam" : "world"; // world/all → bản đồ toàn cầu
    const mapEvents = activeRegion === "__all__" ? evPosts : evPosts.filter((e) => e.region === activeRegion);
    const tlItems = activeRegion === "__all__" ? tl : tl.filter((e) => e.region === activeRegion);
    const mapWrap = document.getElementById("atlasMap");
    const tlWrap = document.getElementById("atlasTimeline");
    if (mapWrap) mapWrap.innerHTML = mapSVG(mapEvents, lang, mode);
    if (tlWrap) tlWrap.innerHTML = timelineHTML(tlItems, lang);
  }

  async function render() {
    const root = document.getElementById("atlasRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    POSTS = await Store.all();
    FIGS = await loadFigures();
    await loadWorld();

    // TASK 2: sắp xếp dữ liệu gốc theo năm lịch sử ngay sau khi fetch.
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
      activeRegion = b.dataset.region;                       // TASK 1: đổi khu vực → hoán đổi bản đồ
      seg.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      draw();
    });
    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
