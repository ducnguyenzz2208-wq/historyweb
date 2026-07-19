/*
 * main.js — logic dùng chung mọi trang:
 * header/footer, menu, chuyển ngôn ngữ, theme, hiệu ứng scroll-reveal, loader.
 */
(function () {
  "use strict";
  const cfg = window.SITE_CONFIG || {};

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
          <a href="index.html#timeline" data-i18n="nav.timeline"></a>
          <a href="about.html" ${active === "about" ? 'class="active"' : ""} data-i18n="nav.about"></a>
          <a href="admin.html" ${active === "admin" ? 'class="active"' : ""} data-i18n="nav.admin"></a>
        </nav>
        <div class="nav__actions">
          <button class="lang-btn" data-lang-toggle aria-label="Change language">EN</button>
          <button class="icon-btn" id="themeToggle" aria-label="Toggle theme">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" id="themeIcon"></svg>
          </button>
          <button class="icon-btn nav__toggle" id="navToggle" aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </header>`;
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
          <a href="index.html#timeline" data-i18n="nav.timeline"></a>
          <a href="about.html" data-i18n="nav.about"></a>
          <a href="admin.html" data-i18n="nav.admin"></a>
        </div>
        <div class="footer-col">
          <h5 data-i18n="footer.nav"></h5>
          <p style="font-size:0.9rem;line-height:1.6;color:rgba(244,237,225,0.7)" data-i18n="footer.made"></p>
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

  function injectComponents() {
    const active = document.body.getAttribute("data-page") || "";
    const h = document.getElementById("header-slot");
    const f = document.getElementById("footer-slot");
    if (h) h.innerHTML = header(active);
    if (f) f.innerHTML = footer();

    // site name
    const sn = (cfg.siteName && cfg.siteName[window.I18N.lang]) || "History";
    document.querySelectorAll("[data-site-name]").forEach((el) => (el.textContent = sn));

    // apply translations
    window.I18N.apply(document);

    // theme
    const saved = localStorage.getItem("hw_theme") || "light";
    setTheme(saved);

    wireHeader();
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

  /* ---------- Scroll reveal (gồm cả data-stagger) ---------- */
  function reveal() {
    const els = document.querySelectorAll("[data-reveal], [data-stagger]");
    if (!("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
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
    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach((e) => (e.textContent = e.getAttribute("data-count")));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const target = parseFloat(e.target.getAttribute("data-count")) || 0;
        const suffix = e.target.getAttribute("data-count-suffix") || "";
        const dur = 1400, t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          e.target.textContent = Math.round(target * eased).toLocaleString("vi-VN") + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach((e) => io.observe(e));
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
