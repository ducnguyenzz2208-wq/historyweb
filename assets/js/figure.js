/*
 * figure.js — trang chi tiết nhân vật, phong cách bách khoa (giống trang sự kiện):
 * hero chân dung + mục lục + infobox tra cứu + dòng dẫn + phân tích + chuyên mục.
 */
(function () {
  "use strict";

  const getSlug = () => new URLSearchParams(location.search).get("slug");
  let current = null, body = "";

  // Mục lục từ tiêu đề h2/h3 (giống post.js)
  function buildToc(html) {
    const tmp = document.createElement("div"); tmp.innerHTML = html;
    const heads = [...tmp.querySelectorAll("h2, h3")];
    if (heads.length < 2) return "";
    const items = heads.map((h, i) => {
      const sub = h.tagName === "H3" ? "toc__item--sub" : "";
      return `<li class="toc__item ${sub}"><a href="#${h.id}"><span class="toc__num">${i + 1}</span>${h.textContent}</a></li>`;
    }).join("");
    return `<nav class="toc glass" aria-label="Mục lục"><div class="toc__title">${window.I18N.t("article.contents")}</div><ol class="toc__list">${items}</ol></nav>`;
  }

  function infobox(f, lang, fb) {
    const regionLabel = f.region === "vietnam" ? window.I18N.t("region.vietnam") : f.region === "world" ? window.I18N.t("region.world") : "—";
    const tags = (f.tags || []).map((t) => `<a class="chip chip--sm" href="topics.html?tag=${encodeURIComponent(t)}">${t}</a>`).join("");
    const row = (k, v) => v ? `<div class="infobox__row"><dt>${k}</dt><dd>${v}</dd></div>` : "";
    return `
      <aside class="infobox glass" data-reveal>
        <div class="infobox__figure infobox__figure--portrait">
          <img src="${f.portrait || fb}" alt="${Store.localized(f.name, lang)}" onerror="this.onerror=null;this.src='${fb}'">
        </div>
        <div class="infobox__title">${window.I18N.t("article.infobox")}</div>
        <dl class="infobox__list">
          ${row(window.I18N.t("figure.born"), f.born)}
          ${row(window.I18N.t("figure.died"), f.died)}
          ${row(window.I18N.t("figure.field"), Store.localized(f.field, lang))}
          ${row(window.I18N.t("figure.era"), Store.localized(f.era, lang))}
          ${row(window.I18N.t("article.region"), regionLabel)}
          ${tags ? `<div class="infobox__row infobox__row--tags"><dt>${window.I18N.t("article.topics")}</dt><dd>${tags}</dd></div>` : ""}
        </dl>
      </aside>`;
  }

  async function render() {
    const root = document.getElementById("figureRoot");
    if (!root) return;
    const lang = window.I18N.lang;

    if (!current) {
      const figures = await (window.loadFigures ? window.loadFigures() : Promise.resolve([]));
      current = figures.find((x) => x.slug === getSlug()) || null;
      if (current) {
        // Ưu tiên nội dung local (vừa đăng) trước khi fetch server
        const localMap = (() => { try { return JSON.parse(localStorage.getItem("hw_pending_fig_content") || "{}"); } catch (e) { return {}; } })();
        if (localMap[current.slug]) {
          body = localMap[current.slug];
        } else if (current.file) {
          try { body = await (await fetch(current.file + "?_=" + Date.now())).text(); } catch (e) { body = ""; }
        }
      }
    }
    const f = current;
    if (!f) {
      document.title = window.I18N.t("figure.notfound");
      root.innerHTML = `<section class="page-hero"><div class="wrap"><h1>${window.I18N.t("figure.notfound")}</h1><a class="btn mt-2" href="figures.html">${window.I18N.t("figure.back")}</a></div></section>`;
      return;
    }

    const name = Store.localized(f.name, lang);
    const role = Store.localized(f.role, lang);
    const excerpt = Store.localized(f.excerpt, lang);
    const fb = window.figureFallback(name).replace(/'/g, "&#39;");
    document.title = name + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");
    if (window.hwMeta) window.hwMeta({ title: name, description: excerpt, image: f.portrait || undefined });

    const bodyHtml = window.mdToHtml(body);
    const toc = buildToc(bodyHtml);
    const tags = (f.tags || []).map((t) => `<a class="chip" href="topics.html?tag=${encodeURIComponent(t)}">${t}</a>`).join("");

    const cfg = window.SITE_CONFIG || {};
    const repo = `${cfg.repoOwner}/${cfg.repoName}`, branch = cfg.branch || "main";
    const author = (cfg.profile && cfg.profile.name) || (cfg.siteName || {})[lang] || "";
    const historyUrl = `https://github.com/${repo}/commits/${branch}/figures/${f.slug}.md`;
    const correctionUrl = `https://github.com/${repo}/issues/new?title=${encodeURIComponent("[Góp ý] " + name)}&body=${encodeURIComponent("Trang: " + location.href + "\n\nGóp ý / nguồn tham khảo:\n")}`;

    const related = (await (window.loadFigures ? window.loadFigures() : Promise.resolve([])))
      .filter((x) => x.slug !== f.slug && (x.tags || []).some((t) => (f.tags || []).includes(t))).slice(0, 3);

    root.innerHTML = `
      <div class="progress-bar" id="progressBar"></div>
      <section class="post-hero figure-hero2">
        <div class="post-hero__bg"><img src="${f.portrait || fb}" alt="" onerror="this.onerror=null;this.src='${fb}'"></div>
        <div class="aurora" aria-hidden="true"><span class="aurora__blob aurora__blob--1"></span><span class="aurora__blob aurora__blob--2"></span></div>
        <div class="wrap post-hero__inner">
          <a href="figures.html" class="kicker" style="color:var(--gold-soft);margin-bottom:1rem">← ${window.I18N.t("figure.back")}</a>
          <div class="figure-hero__role">${role}</div>
          <h1>${name}</h1>
          <div class="post-hero__meta">
            <span class="figure-hero__life">${f.born || "?"} — ${f.died || ""}</span>
            ${(f.tags || []).map((t) => `<span class="tag" style="background:rgba(216,183,78,0.18);color:var(--gold-soft)">${t}</span>`).join("")}
          </div>
        </div>
      </section>

      <div class="article-layout">
        ${toc ? `<div class="article-layout__aside">${toc}</div>` : `<div class="article-layout__aside"></div>`}
        <article class="article article--wiki">
          <div class="article__byline">
            <a class="article__author" href="profile.html">
              <span class="article__author-mark">${(author || "H").trim().charAt(0)}</span>
              <span>${window.I18N.t("article.by")} <b>${author}</b></span>
            </a>
          </div>
          <p class="article__lead">${excerpt}</p>
          <div class="article__toolbar">
            <a class="article__tool" href="admin.html?type=figure&slug=${encodeURIComponent(f.slug)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
              <span>${window.I18N.t("article.edit")}</span>
            </a>
            <button class="article__tool" id="shareBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
              <span>${window.I18N.t("post.share")}</span>
            </button>
            <a class="article__tool" href="${historyUrl}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v5h5M3.05 13a9 9 0 106-8.5L3 8"/><path d="M12 7v5l3 2"/></svg>
              <span>${window.I18N.t("article.history")}</span>
            </a>
            <a class="article__tool" href="${correctionUrl}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>
              <span>${window.I18N.t("article.correction")}</span>
            </a>
          </div>
          ${infobox(f, lang, fb)}
          <div class="prose">${bodyHtml}</div>
          ${tags ? `<div class="article__categories"><span class="article__categories-label">${window.I18N.t("article.categories")}</span><div class="chips">${tags}</div></div>` : ""}
          <div class="article__foot">
            <a class="btn btn--ghost" href="figures.html">← ${window.I18N.t("figure.back")}</a>
            <a class="article__top" href="#">↑ ${window.I18N.t("article.top")}</a>
          </div>
        </article>
      </div>

      ${related.length ? `
      <section class="section section--alt"><div class="wrap">
        <div class="section-head"><span class="kicker">${window.I18N.t("post.related")}</span></div>
        <div class="figures-grid">
          ${related.map((r) => {
            const rn = Store.localized(r.name, lang); const rfb = window.figureFallback(rn).replace(/'/g, "&#39;");
            return `<article class="figure-card glass"><a class="figure-card__media" href="figure.html?slug=${encodeURIComponent(r.slug)}">
              <span class="figure-card__life">${r.born || "?"} – ${r.died || ""}</span>
              <img src="${r.portrait || rfb}" alt="${rn}" loading="lazy" onerror="this.onerror=null;this.src='${rfb}'">
              <div class="figure-card__cap"><h3>${rn}</h3><div class="figure-card__role">${Store.localized(r.role, lang)}</div></div></a>
              <div class="figure-card__body"><p class="figure-card__excerpt">${Store.localized(r.excerpt, lang)}</p>
              <a class="figure-card__link" href="figure.html?slug=${encodeURIComponent(r.slug)}"><span>${window.I18N.t("figures.analyze")}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a></div></article>`;
          }).join("")}
        </div>
      </div></section>` : ""}`;

    wireProgress();
    wireShare(name);
    wireTocHighlight();
    if (window.hwReveal) window.hwReveal();
    window.scrollTo(0, 0);
  }

  function wireProgress() {
    const bar = document.getElementById("progressBar"); if (!bar) return;
    const onScroll = () => { const h = document.documentElement; bar.style.width = Math.min(100, Math.max(0, (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100)) + "%"; };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }
  function wireShare(title) {
    const btn = document.getElementById("shareBtn"); if (!btn) return;
    btn.addEventListener("click", async () => {
      if (navigator.share) { try { await navigator.share({ title, url: location.href }); } catch (e) {} }
      else { try { await navigator.clipboard.writeText(location.href); const s = btn.querySelector("span"); const o = s.textContent; s.textContent = "✓"; setTimeout(() => (s.textContent = o), 1500); } catch (e) {} }
    });
  }
  function wireTocHighlight() {
    const links = [...document.querySelectorAll(".toc__list a")];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = {}; links.forEach((a) => { const id = a.getAttribute("href").slice(1); const el = document.getElementById(id); if (el) map[id] = a; });
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { links.forEach((a) => a.parentElement.classList.remove("active")); if (map[e.target.id]) map[e.target.id].parentElement.classList.add("active"); } }), { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach((id) => io.observe(document.getElementById(id)));
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", () => render());
})();
