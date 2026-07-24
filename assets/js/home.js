/*
 * home.js — dựng nội dung động cho trang chủ: timeline, bài nổi bật, bài mới nhất.
 */
(function () {
  "use strict";

  function cardHTML(p, lang) {
    const title = Store.localized(p.title, lang);
    const excerpt = Store.localized(p.excerpt, lang);
    const tags = (p.tags || []).slice(0, 2).map((t) => `<span class="tag">${t}</span>`).join("");
    const fb = fallbackCover(p.year);
    const cover = p.cover || fb;
    return `
    <article class="card" data-reveal>
      <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="card__media">
        ${p.year ? `<span class="card__year">${p.year}</span>` : ""}
        <img src="${cover}" alt="${title}" loading="lazy" data-fallback="${window.hwFallback(p.cover, fb)}">
      </a>
      <div class="card__body">
        <div class="card__tags">${tags}</div>
        <h3 class="card__title"><a href="post.html?slug=${encodeURIComponent(p.slug)}">${title}</a></h3>
        <p class="card__excerpt">${excerpt}</p>
        <div class="card__meta"><span>${window.fmtDate(p.date, lang)}</span></div>
      </div>
    </article>`;
  }

  const fallbackCover = (year) => window.hwPlaceholder(year || "H", 800, 500);

  async function render() {
    const lang = window.I18N.lang;
    const posts = await Store.all();

    // Timeline: các bài có year, sắp theo năm
    const tl = document.getElementById("timelineTrack");
    if (tl) {
      const withYear = posts.filter((p) => p.year).sort((a, b) => (+a.year || 0) - (+b.year || 0));
      tl.innerHTML =
        '<div class="timeline__line"></div>' +
        (withYear.length
          ? withYear.map((p) => `
            <a class="tl-item" href="post.html?slug=${encodeURIComponent(p.slug)}">
              <div class="tl-item__year">${p.year}</div>
              <div class="tl-item__dot"></div>
              <div class="tl-item__label"><b>${Store.localized(p.title, lang)}</b></div>
            </a>`).join("")
          : `<p style="color:var(--text-soft);padding:2rem">—</p>`);
    }

    // Featured: bài đánh dấu featured, hoặc bài mới nhất
    const feat = document.getElementById("featuredSlot");
    if (feat) {
      const fp = posts.find((p) => p.featured) || posts[0];
      if (fp) {
        feat.innerHTML = `
        <div class="featured" data-reveal>
          <a class="featured__media" href="post.html?slug=${encodeURIComponent(fp.slug)}">
            <img src="${fp.cover || fallbackCover(fp.year)}" alt="" data-fallback="${window.hwFallback(fp.cover, fallbackCover(fp.year))}">
          </a>
          <div class="featured__body">
            <span class="kicker" data-i18n="featured.kicker">${window.I18N.t("featured.kicker")}</span>
            ${fp.year ? `<div class="featured__year">${fp.year}</div>` : ""}
            <h2 class="featured__title">${Store.localized(fp.title, lang)}</h2>
            <p class="featured__excerpt">${Store.localized(fp.excerpt, lang)}</p>
            <a class="btn" href="post.html?slug=${encodeURIComponent(fp.slug)}">
              <span>${window.I18N.t("featured.readmore")}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </div>`;
      }
    }

    // Latest grid (bỏ bài featured đã hiển thị)
    const grid = document.getElementById("latestGrid");
    if (grid) {
      const featSlug = (posts.find((p) => p.featured) || posts[0] || {}).slug;
      const rest = posts.filter((p) => p.slug !== featSlug).slice(0, 6);
      grid.innerHTML = rest.length
        ? rest.map((p) => cardHTML(p, lang)).join("")
        : `<p class="empty-state" data-i18n="blog.empty">${window.I18N.t("blog.empty")}</p>`;
    }

    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
