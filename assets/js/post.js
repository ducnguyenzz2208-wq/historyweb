/*
 * post.js — render một bài viết đơn (đọc slug từ URL), thanh tiến trình đọc, bài liên quan.
 */
(function () {
  "use strict";

  function getSlug() {
    return new URLSearchParams(location.search).get("slug");
  }

  function fallbackCover(year) {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%234a1520'/><stop offset='1' stop-color='%232b0d12'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='55%' fill='%23c9a227' font-family='Georgia' font-size='240' font-weight='700' text-anchor='middle'>${year || "H"}</text></svg>`
    );
  }

  let currentPost = null;
  let currentBody = "";

  async function render() {
    const lang = window.I18N.lang;
    const slug = getSlug();
    const root = document.getElementById("postRoot");
    if (!root) return;

    if (!currentPost) {
      currentPost = await Store.bySlug(slug);
      if (currentPost) currentBody = await Store.content(currentPost);
    }
    const p = currentPost;

    if (!p) {
      document.title = window.I18N.t("post.notfound");
      root.innerHTML = `
        <section class="page-hero"><div class="wrap">
          <h1 data-i18n="post.notfound">${window.I18N.t("post.notfound")}</h1>
          <p data-i18n="post.notfounddesc">${window.I18N.t("post.notfounddesc")}</p>
          <a class="btn mt-2" href="blog.html">${window.I18N.t("post.back")}</a>
        </div></section>`;
      return;
    }

    const title = Store.localized(p.title, lang);
    const rt = Store.readTime(currentBody, lang);
    document.title = title + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");

    const related = (await Store.all())
      .filter((x) => x.slug !== p.slug && (x.tags || []).some((t) => (p.tags || []).includes(t)))
      .slice(0, 3);

    root.innerHTML = `
      <div class="progress-bar" id="progressBar"></div>
      <section class="post-hero">
        <div class="post-hero__bg"><img src="${p.cover || fallbackCover(p.year)}" alt=""></div>
        <div class="wrap post-hero__inner">
          <a href="blog.html" class="kicker" style="color:var(--gold-soft);margin-bottom:1rem">← ${window.I18N.t("post.back")}</a>
          ${p.year ? `<div class="post-hero__year">${p.year}</div>` : ""}
          <h1>${title}</h1>
          <div class="post-hero__meta">
            <span>${window.I18N.t("post.published")} ${window.fmtDate(p.date, lang)}</span>
            <span class="dot" style="width:3px;height:3px;border-radius:50%;background:currentColor"></span>
            <span>${rt} ${window.I18N.t("blog.readtime")}</span>
            ${(p.tags || []).map((t) => `<span class="tag" style="background:rgba(216,183,78,0.18);color:var(--gold-soft)">${t}</span>`).join("")}
          </div>
        </div>
      </section>

      <article class="article">
        <div class="prose">${window.mdToHtml(currentBody)}</div>
        <div class="article__foot">
          <a class="btn btn--ghost" href="blog.html">← ${window.I18N.t("post.back")}</a>
          <button class="btn" id="shareBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
            <span>${window.I18N.t("post.share")}</span>
          </button>
        </div>
      </article>

      ${related.length ? `
      <section class="section section--alt">
        <div class="wrap">
          <div class="section-head"><span class="kicker">${window.I18N.t("post.related")}</span></div>
          <div class="grid">
            ${related.map((r) => `
              <article class="card" data-reveal>
                <a href="post.html?slug=${encodeURIComponent(r.slug)}" class="card__media">
                  ${r.year ? `<span class="card__year">${r.year}</span>` : ""}
                  <img src="${r.cover || fallbackCover(r.year)}" alt="" loading="lazy">
                </a>
                <div class="card__body">
                  <h3 class="card__title"><a href="post.html?slug=${encodeURIComponent(r.slug)}">${Store.localized(r.title, lang)}</a></h3>
                  <p class="card__excerpt">${Store.localized(r.excerpt, lang)}</p>
                </div>
              </article>`).join("")}
          </div>
        </div>
      </section>` : ""}
    `;

    wireProgress();
    wireShare(title);
    if (window.hwReveal) window.hwReveal();
    window.scrollTo(0, 0);
  }

  function wireProgress() {
    const bar = document.getElementById("progressBar");
    if (!bar) return;
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = Math.min(100, Math.max(0, pct)) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  function wireShare(title) {
    const btn = document.getElementById("shareBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const url = location.href;
      if (navigator.share) {
        try { await navigator.share({ title, url }); } catch (e) {}
      } else {
        try { await navigator.clipboard.writeText(url); btn.querySelector("span").textContent = "✓"; setTimeout(() => (btn.querySelector("span").textContent = window.I18N.t("post.share")), 1500); } catch (e) {}
      }
    });
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
