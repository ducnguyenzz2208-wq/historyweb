/*
 * main.js — logic dùng chung mọi trang:
 * header/footer, menu, chuyển ngôn ngữ, theme, hiệu ứng scroll-reveal, loader.
 */
(function () {
  "use strict";
  const cfg = window.SITE_CONFIG || {};

  /* ---------- PWA: đăng ký service worker (đọc offline) ---------- */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  /* ---------- SEO: cập nhật thẻ meta / Open Graph động ---------- */
  function upsertMeta(sel, attr, key, val) {
    let el = document.head.querySelector(sel);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", val);
  }
  window.hwMeta = function (m) {
    if (m.description) upsertMeta('meta[name="description"]', "name", "description", m.description);
    if (m.title) upsertMeta('meta[property="og:title"]', "property", "og:title", m.title);
    if (m.description) upsertMeta('meta[property="og:description"]', "property", "og:description", m.description);
    if (m.image) upsertMeta('meta[property="og:image"]', "property", "og:image", m.image);
    upsertMeta('meta[property="og:url"]', "property", "og:url", location.href);
    // canonical
    let c = document.head.querySelector('link[rel="canonical"]');
    if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
    c.href = location.href;
  };

  /* ---------- Header ---------- */
  function header(active) {
    return `
    <header class="site-header" id="siteHeader">
      <div class="wrap nav">
        <a class="brand" href="index.html" aria-label="Home">
          <span class="brand__mark">H</span>
          <span class="brand__name" data-site-name></span>
        </a>
        <nav class="nav__links" id="navLinks">
          <a href="index.html" ${active === "home" ? 'class="active"' : ""} data-i18n="nav.home"></a>
          <a href="blog.html" ${active === "blog" ? 'class="active"' : ""} data-i18n="nav.blog"></a>
          <a href="figures.html" ${active === "figures" ? 'class="active"' : ""} data-i18n="nav.figures"></a>
          <a href="topics.html" ${active === "topics" ? 'class="active"' : ""} data-i18n="nav.topics"></a>
          <a href="atlas.html" ${active === "atlas" ? 'class="active"' : ""} data-i18n="nav.atlas"></a>
          <a href="admin.html" ${active === "admin" ? 'class="active"' : ""} data-i18n="nav.admin"></a>
        </nav>
        <div class="nav__actions">
          <button class="icon-btn" id="searchToggle" aria-label="Tra cứu" data-i18n-attr="aria-label:search.open">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          </button>
          <button class="lang-btn" data-lang-toggle aria-label="Change language">EN</button>
          <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" id="themeIcon"></svg>
          </button>
          <a class="nav-avatar ${active === "profile" ? "active" : ""}" href="profile.html" aria-label="Trang cá nhân" data-i18n-attr="aria-label:nav.profile">${avatarInner()}</a>
          <button class="icon-btn nav__toggle" id="navToggle" aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </header>`;
  }

  // Avatar nhỏ ở góc header → mở trang cá nhân
  function avatarInner() {
    const p = cfg.profile || {};
    if (p.avatar) return `<img src="${p.avatar}" alt="">`;
    const initials = (p.name || "H").trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
    return `<span class="nav-avatar__mono">${initials}</span>`;
  }

  /* ---------- Footer ---------- */
  function footer() {
    const yr = new Date().getFullYear();
    return `
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <a class="brand" href="index.html"><span class="brand__mark">H</span><span class="brand__name" data-site-name></span></a>
          <p class="footer-tagline" data-i18n="footer.tagline"></p>
        </div>
        <div class="footer-col">
          <h5 data-i18n="footer.nav"></h5>
          <a href="index.html" data-i18n="nav.home"></a>
          <a href="blog.html" data-i18n="nav.blog"></a>
          <a href="figures.html" data-i18n="nav.figures"></a>
          <a href="topics.html" data-i18n="nav.topics"></a>
          <a href="atlas.html" data-i18n="nav.atlas"></a>
        </div>
        <div class="footer-col">
          <h5 data-i18n="footer.nav"></h5>
          <a href="gallery.html" data-i18n="nav.gallery"></a>
          <a href="profile.html" data-i18n="nav.profile"></a>
          <a href="admin.html" data-i18n="nav.admin"></a>
          <a href="rss.xml" target="_blank" rel="noopener">RSS</a>
          <p style="font-size:0.9rem;line-height:1.6;color:rgba(244,237,225,0.7);margin-top:1rem" data-i18n="footer.made"></p>
        </div>
      </div>
      <div class="wrap footer-bottom">
        <span>© ${yr} <span data-site-name></span>. <span data-i18n="footer.rights"></span></span>
        <span data-i18n="footer.tagline"></span>
      </div>
    </footer>`;
  }

  const sun = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  const moon = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';

  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("hw_theme", t);
    const icon = document.getElementById("themeIcon");
    if (icon) icon.innerHTML = t === "dark" ? sun : moon;
  }

  /* ---------- Search overlay (tra cứu toàn trang) ---------- */
  function searchOverlay() {
    return `
    <div class="search-overlay" id="searchOverlay" aria-hidden="true">
      <div class="search-overlay__panel glass" role="dialog" aria-modal="true">
        <div class="search-overlay__bar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input type="search" id="globalSearch" autocomplete="off" data-i18n-attr="placeholder:search.placeholder">
          <button class="search-overlay__close" id="searchClose" aria-label="Đóng">esc</button>
        </div>
        <div class="search-overlay__results" id="searchResults"></div>
        <div class="search-overlay__hint" data-i18n="search.hint"></div>
      </div>
    </div>`;
  }

  function injectComponents() {
    const active = document.body.getAttribute("data-page") || "";
    const h = document.getElementById("header-slot");
    const f = document.getElementById("footer-slot");
    if (h) h.innerHTML = header(active);
    if (f) f.innerHTML = footer();
    document.body.insertAdjacentHTML("beforeend", searchOverlay());

    // site name
    const sn = (cfg.siteName && cfg.siteName[window.I18N.lang]) || "History";
    document.querySelectorAll("[data-site-name]").forEach((el) => (el.textContent = sn));

    // apply translations
    window.I18N.apply(document);

    // theme
    const saved = localStorage.getItem("hw_theme") || "light";
    setTheme(saved);

    wireHeader();
    wireSearch();
  }

  /* ---------- Tra cứu toàn văn: nạp chỉ mục (gồm nội dung .md) ---------- */
  let searchIndex = null;
  async function fetchText(url) {
    try { const r = await fetch(url + "?_=" + Date.now()); return r.ok ? await r.text() : ""; } catch (e) { return ""; }
  }
  async function buildIndex() {
    if (searchIndex) return searchIndex;
    const idx = [];
    try {
      const posts = await (window.Store ? Store.all() : Promise.resolve([]));
      const bodies = await Promise.all(posts.map((p) => (p.file ? fetchText(p.file) : Promise.resolve(""))));
      posts.forEach((p, i) => idx.push({
        type: "post", slug: p.slug, url: `post.html?slug=${encodeURIComponent(p.slug)}`,
        title: p.title, sub: p.excerpt, year: p.year, region: p.region, tags: p.tags || [], body: bodies[i] || "",
      }));
    } catch (e) {}
    try {
      const res = await fetch("figures/index.json?_=" + Date.now());
      if (res.ok) {
        const figs = (await res.json()).figures || [];
        const bodies = await Promise.all(figs.map((f) => (f.file ? fetchText(f.file) : Promise.resolve(""))));
        figs.forEach((f, i) => idx.push({
          type: "figure", slug: f.slug, url: `figure.html?slug=${encodeURIComponent(f.slug)}`,
          title: f.name, sub: f.role, year: f.born, region: f.region, tags: f.tags || [], body: bodies[i] || "",
        }));
      }
    } catch (e) {}
    searchIndex = idx;
    return idx;
  }

  /* Lịch sử tra cứu (lưu trong trình duyệt) */
  const RECENT_KEY = "hw_recent_search";
  function getRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } }
  function pushRecent(q) {
    q = q.trim(); if (!q) return;
    let list = getRecent().filter((x) => x.toLowerCase() !== q.toLowerCase());
    list.unshift(q); list = list.slice(0, 6);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  }

  function wireSearch() {
    const overlay = document.getElementById("searchOverlay");
    const input = document.getElementById("globalSearch");
    const results = document.getElementById("searchResults");
    if (!overlay || !input) return;

    const esc = (s) => (s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    const open = () => {
      overlay.classList.add("open"); overlay.setAttribute("aria-hidden", "false");
      buildIndex().then(() => { input.focus(); input.value ? run() : showEmpty(); });
      if (!input.value) showEmpty();
    };
    const close = () => { overlay.classList.remove("open"); overlay.setAttribute("aria-hidden", "true"); };

    const typeLabel = (t) => window.I18N.t(t === "figure" ? "nav.figures" : "nav.blog");
    // Bỏ dấu để tra cứu không phân biệt dấu tiếng Việt & dấu Latin
    const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

    // Trạng thái rỗng: gợi ý chủ đề + lịch sử tra cứu
    function showEmpty() {
      const recent = getRecent();
      const suggested = ["Việt Nam", "cách mạng", "Napoléon", "khoa học"];
      const chip = (q) => `<button class="search-chip" data-q="${esc(q)}">${esc(q)}</button>`;
      results.innerHTML = `
        ${recent.length ? `<div class="search-sect"><div class="search-sect__label">${window.I18N.t("search.recent")}</div><div class="search-chips">${recent.map(chip).join("")}</div></div>` : ""}
        <div class="search-sect"><div class="search-sect__label">${window.I18N.t("search.suggested")}</div><div class="search-chips">${suggested.map(chip).join("")}</div></div>`;
      results.querySelectorAll(".search-chip").forEach((b) =>
        b.addEventListener("click", () => { input.value = b.dataset.q; run(); input.focus(); }));
    }

    // Trích đoạn quanh từ khoá trong nội dung
    function snippet(body, q, fallback) {
      const nb = norm(body); const pos = nb.indexOf(q);
      if (pos < 0) return esc(fallback || "");
      const start = Math.max(0, pos - 40), end = Math.min(body.length, pos + q.length + 60);
      const raw = (start > 0 ? "…" : "") + body.slice(start, end).replace(/\s+/g, " ").trim() + (end < body.length ? "…" : "");
      // tô đậm đoạn khớp (dựa trên vị trí đã bỏ dấu ~ độ dài tương đương)
      return esc(raw);
    }

    async function run() {
      const lang = window.I18N.lang;
      const q = norm(input.value.trim());
      if (!q) { showEmpty(); return; }
      const index = await buildIndex();
      if (norm(input.value.trim()) !== q) return; // đã gõ tiếp, bỏ kết quả cũ
      const hits = index.map((it) => {
        const titleAll = [Store.localized(it.title, "vi"), Store.localized(it.title, "en")].join(" ");
        const subAll = [Store.localized(it.sub, "vi"), Store.localized(it.sub, "en")].join(" ");
        const title = Store.localized(it.title, lang);
        const sub = Store.localized(it.sub, lang);
        const inMeta = norm(titleAll + " " + subAll + " " + it.tags.join(" ") + " " + (it.year || "")).includes(q);
        const inBody = norm(it.body).includes(q);
        // xếp hạng: khớp tiêu đề > meta > nội dung
        const score = norm(titleAll).includes(q) ? 3 : inMeta ? 2 : inBody ? 1 : 0;
        return { it, title, sub, score, inBodyOnly: !inMeta && inBody };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);

      results.innerHTML = hits.length
        ? hits.map((h) => `
          <a class="search-hit" href="${h.it.url}">
            <span class="search-hit__type">${typeLabel(h.it.type)}</span>
            <span class="search-hit__main">
              <b>${esc(h.title)}</b>
              <small>${h.inBodyOnly ? snippet(h.it.body, q, h.sub) : esc(h.sub || "")}</small>
            </span>
            ${h.it.year ? `<span class="search-hit__year">${h.it.year}</span>` : ""}
          </a>`).join("")
        : `<p class="search-empty">${window.I18N.t("search.none")}</p>`;

      // lưu lịch sử khi có kết quả
      if (hits.length) pushRecent(input.value.trim());
      results.querySelectorAll(".search-hit").forEach((a) =>
        a.addEventListener("click", () => pushRecent(input.value.trim())));
    }

    let deb;
    input.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(run, 180); });
    document.querySelectorAll("#searchToggle").forEach((b) => b.addEventListener("click", open));
    const closeBtn = document.getElementById("searchClose");
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); open(); }
      if (e.key === "Escape" && overlay.classList.contains("open")) close();
    });
  }

  function wireHeader() {
    const headerEl = document.getElementById("siteHeader");
    // Trang không có hero tối ở đầu → giữ header nền đặc để chữ luôn đọc được
    const hasHero = document.querySelector(".hero, .page-hero, .post-hero");
    if (!hasHero) {
      headerEl.classList.add("scrolled");
    } else {
      const onScroll = () => {
        if (window.scrollY > 40) headerEl.classList.add("scrolled");
        else headerEl.classList.remove("scrolled");
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    document.querySelectorAll("[data-lang-toggle]").forEach((btn) =>
      btn.addEventListener("click", () => window.I18N.toggle())
    );

    const tt = document.getElementById("themeToggle");
    if (tt) tt.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      setTheme(cur === "dark" ? "light" : "dark");
    });

    const nt = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (nt && links) {
      nt.addEventListener("click", () => links.classList.toggle("open"));
      links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("open")));
    }
  }

  // update site name on language change
  window.addEventListener("langchange", () => {
    const sn = (cfg.siteName && cfg.siteName[window.I18N.lang]) || "History";
    document.querySelectorAll("[data-site-name]").forEach((el) => (el.textContent = sn));
  });

  /* Phần tử có đang nằm trong khung nhìn không */
  function inViewport(el, margin) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top < vh * (1 - (margin || 0)) && r.bottom > 0;
  }

  /* ---------- Scroll reveal (gồm cả data-stagger) ---------- */
  function reveal() {
    const els = document.querySelectorAll("[data-reveal], [data-stagger]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
    // Lưới an toàn: nếu IO bị tiết lưu, vẫn hiện phần tử đầu trang sau một nhịp ngắn.
    setTimeout(() => els.forEach((e) => { if (!e.classList.contains("in") && inViewport(e, 0.04)) e.classList.add("in"); }), 700);
  }
  window.hwReveal = reveal; // cho các module động gọi lại

  /* ---------- Loader ---------- */
  function loader() {
    const l = document.getElementById("pageLoader");
    if (!l) return;
    window.addEventListener("load", () => setTimeout(() => l.classList.add("done"), 350));
    // fallback
    setTimeout(() => l.classList.add("done"), 2200);
  }

  /* ---------- Hero title split (per-char reveal) ---------- */
  function splitHero() {
    const t = document.querySelector("[data-split]");
    if (!t) return;
    const text = t.textContent.trim();
    t.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "char";
      s.textContent = ch === " " ? " " : ch;
      s.style.opacity = "0";
      s.style.transform = "translateY(40%)";
      s.style.transition = `opacity 0.7s var(--ease) ${i * 0.05}s, transform 0.7s var(--ease) ${i * 0.05}s`;
      t.appendChild(s);
    });
    requestAnimationFrame(() =>
      requestAnimationFrame(() => t.querySelectorAll(".char").forEach((c) => { c.style.opacity = "1"; c.style.transform = "none"; }))
    );
  }

  /* ---------- Parallax hero background ---------- */
  function parallax() {
    const bg = document.querySelector("[data-parallax]");
    if (!bg) return;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      if (y < window.innerHeight) bg.style.transform = `translateY(${y * 0.35}px)`;
    }, { passive: true });
  }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Nút nam châm (magnetic hover) ---------- */
  function magnetic() {
    if (reduced || matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll("[data-magnetic], .btn").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.18}px, ${my * 0.24}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- Kính lỏng: vệt sáng theo con trỏ ---------- */
  function glassPointer() {
    if (reduced) return;
    document.addEventListener("mousemove", (e) => {
      const g = e.target.closest && e.target.closest(".glass");
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      g.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    }, { passive: true });
  }

  /* ---------- Nghiêng 3D nhẹ cho thẻ [data-tilt] ---------- */
  function tilt() {
    if (reduced || matchMedia("(pointer: coarse)").matches) return;
    document.querySelectorAll("[data-tilt]").forEach((el) => {
      el.classList.add("tilt");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const rx = (0.5 - (e.clientY - r.top) / r.height) * 8;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- Đếm số (count-up) cho [data-count] khi vào màn hình ---------- */
  function countUp() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    const animate = (el) => {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      const target = parseFloat(el.getAttribute("data-count")) || 0;
      const suffix = el.getAttribute("data-count-suffix") || "";
      if (reduced) { el.textContent = target.toLocaleString("vi-VN") + suffix; return; }
      const dur = 1400, t0 = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("vi-VN") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) { els.forEach(animate); return; }
    els.forEach((el) => {
      if (inViewport(el, 0.1)) { animate(el); return; } // đã thấy → chạy ngay
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => { if (e.isIntersecting) { obs.disconnect(); animate(el); } });
      }, { threshold: 0.35 });
      io.observe(el);
    });
    // Lưới an toàn cho các phần tử đầu trang nếu IO bị tiết lưu
    setTimeout(() => els.forEach((el) => { if (!el.dataset.counted && inViewport(el, 0.1)) animate(el); }), 800);
  }
  window.hwCountUp = countUp;

  document.addEventListener("DOMContentLoaded", () => {
    injectComponents();
    reveal();
    loader();
    splitHero();
    parallax();
    magnetic();
    glassPointer();
    tilt();
    countUp();
  });
})();
