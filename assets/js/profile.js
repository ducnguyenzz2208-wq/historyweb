/*
 * profile.js — trang cá nhân của người biên soạn: thẻ hồ sơ kính lỏng,
 * chỉ số, và danh sách bài viết / nhân vật đã đăng. Dữ liệu lấy từ config.profile.
 */
(function () {
  "use strict";
  const cfg = window.SITE_CONFIG || {};
  const prof = cfg.profile || {};

  function avatar(name) {
    if (prof.avatar) return `<img src="${prof.avatar}" alt="${name}">`;
    const initials = (name || "H").trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase();
    return `<span class="pf-card__monogram">${initials}</span>`;
  }

  function cardHTML(p, lang) {
    const title = Store.localized(p.title, lang);
    const excerpt = Store.localized(p.excerpt, lang);
    const tags = (p.tags || []).slice(0, 2).map((t) => `<span class="tag">${t}</span>`).join("");
    const fb = "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><rect width='100%' height='100%' fill='%232b0d12'/><text x='50%' y='54%' fill='%23c9a227' font-family='Georgia' font-size='120' font-weight='700' text-anchor='middle'>${p.year || "H"}</text></svg>`);
    const cover = p.cover || fb;
    return `
    <article class="card" data-reveal>
      <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="card__media">
        ${p.year ? `<span class="card__year">${p.year}</span>` : ""}
        <img src="${cover}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">
      </a>
      <div class="card__body">
        <div class="card__tags">${tags}</div>
        <h3 class="card__title"><a href="post.html?slug=${encodeURIComponent(p.slug)}">${title}</a></h3>
        <p class="card__excerpt">${excerpt}</p>
        <div class="card__meta"><span>${window.fmtDate(p.date, lang)}</span></div>
      </div>
    </article>`;
  }

  async function render() {
    const root = document.getElementById("profileRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    const name = prof.name || (cfg.siteName || {})[lang] || "History";
    const tagline = Store.localized(prof.tagline, lang);
    const bio = Store.localized(prof.bio, lang);
    const location = Store.localized(prof.location, lang);

    const posts = await Store.all();
    let figuresCount = 0, topicSet = new Set();
    posts.forEach((p) => (p.tags || []).forEach((t) => topicSet.add(t)));
    try { const r = await fetch("figures/index.json?_=" + Date.now()); if (r.ok) figuresCount = ((await r.json()).figures || []).length; } catch (e) {}

    document.title = name + " · " + ((cfg.siteName || {})[lang] || "History");

    root.innerHTML = `
      <section class="pf-hero">
        <div class="aurora" aria-hidden="true">
          <span class="aurora__blob aurora__blob--1"></span>
          <span class="aurora__blob aurora__blob--2"></span>
          <span class="aurora__blob aurora__blob--3"></span>
        </div>
        <div class="wrap">
          <div class="pf-card glass" data-reveal="scale">
            <div class="pf-card__top">
              <div class="pf-card__avatar">${avatar(name)}</div>
              <div class="pf-card__id">
                <h1 class="pf-card__name">${name}</h1>
                <div class="pf-card__badges">
                  <span class="pf-badge">${window.I18N.t("profile.badge1")}</span>
                  <span class="pf-badge">${window.I18N.t("profile.badge2")}</span>
                </div>
                <p class="pf-card__tagline">${tagline}</p>
              </div>
            </div>
            <div class="pf-card__actions">
              <button class="btn" id="followBtn"><span>${window.I18N.t("profile.follow")}</span></button>
              ${prof.contact ? `<a class="btn btn--ghost" href="${prof.contact}">${window.I18N.t("profile.contact")}</a>` : ""}
              ${prof.github ? `<a class="icon-btn" href="${prof.github}" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 015 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z"/></svg></a>` : ""}
            </div>
            <div class="pf-card__meta">
              ${location ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>${location}</span>` : ""}
              ${prof.joined ? `<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>${prof.joined}</span>` : ""}
            </div>
          </div>

          <div class="pf-stats" data-stagger>
            <div class="stat glass"><div class="stat__num" data-count="${posts.length}"></div><div class="stat__label">${window.I18N.t("profile.stat.posts")}</div></div>
            <div class="stat glass"><div class="stat__num" data-count="${figuresCount}"></div><div class="stat__label">${window.I18N.t("profile.stat.figures")}</div></div>
            <div class="stat glass"><div class="stat__num" data-count="${topicSet.size}"></div><div class="stat__label">${window.I18N.t("profile.stat.topics")}</div></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="wrap">
          <div class="section-head" data-reveal>
            <span class="kicker">${window.I18N.t("profile.about")}</span>
            <p style="font-family:var(--font-serif);font-size:clamp(1.2rem,2.2vw,1.5rem);color:var(--text);line-height:1.55;max-width:720px">${bio}</p>
          </div>

          <div class="section-head" data-reveal style="margin-top:3rem">
            <span class="kicker">${window.I18N.t("profile.articles")}</span>
            <h2 style="font-size:clamp(1.6rem,3.6vw,2.4rem)">${window.I18N.t("profile.articles")}</h2>
          </div>
          <div class="grid" id="pfGrid">
            ${posts.length ? posts.map((p) => cardHTML(p, lang)).join("") : `<p class="empty-state">${window.I18N.t("profile.empty")}</p>`}
          </div>
        </div>
      </section>`;

    wireFollow();
    if (window.hwReveal) window.hwReveal();
    if (window.hwCountUp) window.hwCountUp();
  }

  function wireFollow() {
    const btn = document.getElementById("followBtn");
    if (!btn) return;
    const KEY = "hw_follow";
    const set = (on) => {
      btn.classList.toggle("btn--ghost", on);
      btn.querySelector("span").textContent = window.I18N.t(on ? "profile.followed" : "profile.follow");
    };
    set(localStorage.getItem(KEY) === "1");
    btn.addEventListener("click", () => {
      const on = localStorage.getItem(KEY) !== "1";
      localStorage.setItem(KEY, on ? "1" : "0");
      set(on);
    });
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
