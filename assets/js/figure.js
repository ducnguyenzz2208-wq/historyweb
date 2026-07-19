/*
 * figure.js — trang chi tiết một nhân vật lịch sử (đọc slug từ URL).
 * Render chân dung, thông tin sống–mất, và bài phân tích (Markdown).
 */
(function () {
  "use strict";

  function getSlug() {
    return new URLSearchParams(location.search).get("slug");
  }

  let current = null;
  let body = "";

  async function render() {
    const root = document.getElementById("figureRoot");
    if (!root) return;
    const lang = window.I18N.lang;

    if (!current) {
      const figures = await (window.loadFigures ? window.loadFigures() : Promise.resolve([]));
      current = figures.find((f) => f.slug === getSlug()) || null;
      if (current && current.file) {
        try { body = await (await fetch(current.file + "?_=" + Date.now())).text(); } catch (e) { body = ""; }
      }
    }
    const f = current;

    if (!f) {
      document.title = window.I18N.t("figure.notfound");
      root.innerHTML = `
        <section class="page-hero"><div class="wrap">
          <h1>${window.I18N.t("figure.notfound")}</h1>
          <a class="btn mt-2" href="figures.html">${window.I18N.t("figure.back")}</a>
        </div></section>`;
      return;
    }

    const name = Store.localized(f.name, lang);
    const role = Store.localized(f.role, lang);
    const fb = window.figureFallback(name).replace(/'/g, "&#39;");
    document.title = name + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");

    root.innerHTML = `
      <div class="progress-bar" id="progressBar"></div>
      <section class="figure-hero">
        <div class="aurora" aria-hidden="true">
          <span class="aurora__blob aurora__blob--1"></span>
          <span class="aurora__blob aurora__blob--2"></span>
        </div>
        <div class="wrap figure-hero__inner">
          <div class="figure-hero__portrait">
            <img src="${f.portrait || fb}" alt="${name}" onerror="this.onerror=null;this.src='${fb}'">
          </div>
          <div>
            <a href="figures.html" class="kicker" style="color:var(--gold-soft);margin-bottom:1rem">← ${window.I18N.t("figure.back")}</a>
            <div class="figure-hero__role">${role}</div>
            <h1>${name}</h1>
            <div class="figure-hero__life">${f.born || "?"} — ${f.died || ""}</div>
          </div>
        </div>
      </section>

      <div class="figure-facts">
        <div class="figure-fact glass"><div class="figure-fact__k">${window.I18N.t("figure.born")}</div><div class="figure-fact__v">${f.born || "—"}</div></div>
        <div class="figure-fact glass"><div class="figure-fact__k">${window.I18N.t("figure.died")}</div><div class="figure-fact__v">${f.died || "—"}</div></div>
        <div class="figure-fact glass"><div class="figure-fact__k">${window.I18N.t("figure.field")}</div><div class="figure-fact__v">${Store.localized(f.field, lang) || "—"}</div></div>
        <div class="figure-fact glass"><div class="figure-fact__k">${window.I18N.t("figure.era")}</div><div class="figure-fact__v">${Store.localized(f.era, lang) || "—"}</div></div>
      </div>

      <article class="article">
        <div class="prose">${window.mdToHtml(body)}</div>
        <div class="article__foot">
          <a class="btn btn--ghost" href="figures.html">← ${window.I18N.t("figure.back")}</a>
        </div>
      </article>`;

    wireProgress();
    if (window.hwReveal) window.hwReveal();
    if (window.hwCountUp) window.hwCountUp();
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

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", () => { render(); });
})();
