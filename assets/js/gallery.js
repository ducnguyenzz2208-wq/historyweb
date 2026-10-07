/*
 * gallery.js — Thư viện tư liệu: gom mọi hình ảnh (ảnh bìa bài viết + chân dung nhân vật),
 * kèm nguồn gốc / ghi công, liên kết tới bài hoặc nhân vật tương ứng.
 */
(function () {
  "use strict";

  async function loadFigures() {
    try { const r = await fetch("figures/index.json?_=" + Date.now()); return r.ok ? (await r.json()).figures || [] : []; }
    catch (e) { return []; }
  }

  function tileHTML(item, lang) {
    const title = Store.localized(item.title, lang);
    const esc = window.hwEscapeHtml || ((text) => String(text || "").replace(/[&<>"']/g, c => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[c])));
    const credit = item.credit || (lang === "en" ? "Image provenance and license unverified" : "Chưa xác minh nguồn gốc / giấy phép ảnh");
    const source = item.imageSource;
    const sourceUrl = source?.sourcePage && /^https:\/\/commons\.wikimedia\.org\//.test(source.sourcePage) ? source.sourcePage : "";
    const licenseUrl = source?.licenseUrl && /^https?:\/\//.test(source.licenseUrl) ? source.licenseUrl : "";
    return `
    <figure class="media-tile glass" data-reveal>
      <a class="media-tile__img" href="${item.url}">
        <img src="${item.src}" alt="${title}" loading="lazy" data-fallback="${window.hwFallback(item.src, window.hwPlaceholder((title || "H").slice(0, 2), 800, 600))}">
      </a>
      <figcaption class="media-tile__cap">
        <span class="media-tile__type">${item.type === "figure" ? window.I18N.t("nav.figures") : window.I18N.t("nav.blog")}</span>
        <b>${title}</b>
        <span class="media-tile__src">${window.I18N.t("gallery.source")}: ${esc(credit)}</span>
        ${sourceUrl ? `<a href="${esc(sourceUrl)}" target="_blank" rel="noopener">${lang === "en" ? "File source" : "Trang nguồn ảnh"}</a>` : ""}
        ${licenseUrl ? `<a href="${esc(licenseUrl)}" target="_blank" rel="noopener">${esc(source.license)}</a>` : ""}
        <span>${lang === "en" ? "Editorial review pending" : "Chờ duyệt ngữ cảnh và điều kiện sử dụng"}</span>
        <a class="media-tile__link" href="${item.url}">${window.I18N.t("gallery.view")} →</a>
      </figcaption>
    </figure>`;
  }

  async function render() {
    const root = document.getElementById("galleryRoot");
    if (!root) return;
    const lang = window.I18N.lang;
    const posts = await Store.all();
    const figures = await loadFigures();

    const items = [
      ...posts.filter((p) => p.cover).map((p) => ({
        type: "post", src: p.cover, title: p.title, credit: p.credit, imageSource: p.imageSource,
        url: `${window.hwArticleUrl("post", p.slug)}`,
      })),
      ...figures.filter((f) => f.portrait).map((f) => ({
        type: "figure", src: f.portrait, title: f.name, credit: f.credit, imageSource: f.imageSource,
        url: `${window.hwArticleUrl("figure", f.slug)}`,
      })),
    ];

    document.title = window.I18N.t("gallery.title") + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");
    root.innerHTML = `
      <section class="page-hero">
        <div class="aurora" aria-hidden="true"><span class="aurora__blob aurora__blob--1"></span><span class="aurora__blob aurora__blob--2"></span><span class="aurora__blob aurora__blob--3"></span></div>
        <div class="wrap" data-reveal style="position:relative;z-index:1">
          <span class="kicker">${window.I18N.t("gallery.kicker")}</span>
          <h1>${window.I18N.t("gallery.title")}</h1>
          <p>${window.I18N.t("gallery.subtitle")}</p>
        </div>
      </section>
      <section class="section"><div class="wrap">
        <div class="media-grid">${items.map((it) => tileHTML(it, lang)).join("")}</div>
      </div></section>`;
    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
