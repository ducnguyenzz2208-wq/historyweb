/*
 * post.js — render một bài viết theo phong cách trang báo / bách khoa (Wikipedia):
 * dòng dẫn (byline), infobox tra cứu, mục lục tự động, nội dung, nguồn tham khảo,
 * chuyên mục, thanh tiến trình đọc và nút "Sửa bài viết".
 */
(function () {
  "use strict";

  function getSlug() { return new URLSearchParams(location.search).get("slug"); }

  function fallbackCover(year) {
    return "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1600' height='900'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%234a1520'/><stop offset='1' stop-color='%232b0d12'/></linearGradient></defs><rect width='100%' height='100%' fill='url(%23g)'/><text x='50%' y='55%' fill='%23c9a227' font-family='Georgia' font-size='240' font-weight='700' text-anchor='middle'>${year || "H"}</text></svg>`
    );
  }

  let currentPost = null;
  let currentBody = "";

  // Tách mục lục (h2/h3) từ HTML đã render
  function buildToc(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const heads = [...tmp.querySelectorAll("h2, h3")];
    if (heads.length < 2) return "";
    const items = heads.map((h, i) => {
      const lvl = h.tagName === "H3" ? "toc__item--sub" : "";
      return `<li class="toc__item ${lvl}"><a href="#${h.id}"><span class="toc__num">${i + 1}</span>${h.textContent}</a></li>`;
    }).join("");
    return `
      <nav class="toc glass" aria-label="Mục lục">
        <div class="toc__title">${window.I18N.t("article.contents")}</div>
        <ol class="toc__list">${items}</ol>
      </nav>`;
  }

  function infobox(p, lang, rt) {
    const regionLabel = p.region === "vietnam" ? window.I18N.t("region.vietnam")
      : p.region === "world" ? window.I18N.t("region.world") : "—";
    const tags = (p.tags || []).map((t) => `<a class="chip chip--sm" href="blog.html?tag=${encodeURIComponent(t)}">${t}</a>`).join("");
    const row = (k, v) => v ? `<div class="infobox__row"><dt>${k}</dt><dd>${v}</dd></div>` : "";
    const fb = fallbackCover(p.year);
    return `
      <aside class="infobox glass" data-reveal>
        <div class="infobox__figure">
          <img src="${p.cover || fb}" alt="${Store.localized(p.title, lang)}" onerror="this.onerror=null;this.src='${fb}'">
        </div>
        <div class="infobox__title">${window.I18N.t("article.infobox")}</div>
        <dl class="infobox__list">
          ${row(window.I18N.t("article.region"), regionLabel)}
          ${row(window.I18N.t("article.period"), p.year || "—")}
          ${row(window.I18N.t("article.published"), window.fmtDate(p.date, lang))}
          ${row(window.I18N.t("article.reading"), rt + " " + window.I18N.t("blog.readtime"))}
          ${tags ? `<div class="infobox__row infobox__row--tags"><dt>${window.I18N.t("article.topics")}</dt><dd>${tags}</dd></div>` : ""}
        </dl>
      </aside>`;
  }

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
          <h1>${window.I18N.t("post.notfound")}</h1>
          <p>${window.I18N.t("post.notfounddesc")}</p>
          <a class="btn mt-2" href="blog.html">${window.I18N.t("post.back")}</a>
        </div></section>`;
      return;
    }

    const title = Store.localized(p.title, lang);
    const excerpt = Store.localized(p.excerpt, lang);
    const rt = Store.readTime(currentBody, lang);
    document.title = title + " · " + ((window.SITE_CONFIG.siteName || {})[lang] || "History");

    const bodyHtml = window.mdToHtml(currentBody);
    const toc = buildToc(bodyHtml);
    const tags = (p.tags || []).map((t) => `<a class="chip" href="blog.html?tag=${encodeURIComponent(t)}">${t}</a>`).join("");

    const related = (await Store.all())
      .filter((x) => x.slug !== p.slug && (x.tags || []).some((t) => (p.tags || []).includes(t)))
      .slice(0, 3);

    root.innerHTML = `
      <div class="progress-bar" id="progressBar"></div>
      <section class="post-hero">
        <div class="post-hero__bg"><img src="${p.cover || fallbackCover(p.year)}" alt="" onerror="this.onerror=null;this.src='${fallbackCover(p.year)}'"></div>
        <div class="aurora" aria-hidden="true"><span class="aurora__blob aurora__blob--1"></span><span class="aurora__blob aurora__blob--2"></span></div>
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

      <div class="article-layout">
        ${toc ? `<div class="article-layout__aside">${toc}</div>` : `<div class="article-layout__aside"></div>`}
        <article class="article article--wiki">
          <p class="article__lead">${excerpt}</p>
          <div class="article__toolbar">
            <a class="article__tool" href="admin.html?slug=${encodeURIComponent(p.slug)}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
              <span>${window.I18N.t("article.edit")}</span>
            </a>
            <button class="article__tool" id="citeBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 7h4v4H7zM7 11c0 3-2 4-2 4M13 7h4v4h-4zM13 11c0 3-2 4-2 4"/></svg>
              <span>${window.I18N.t("article.cite")}</span>
            </button>
            <button class="article__tool" id="shareBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
              <span>${window.I18N.t("post.share")}</span>
            </button>
          </div>
          ${infobox(p, lang, rt)}
          <div class="prose">${bodyHtml}</div>
          ${tags ? `
          <div class="article__categories">
            <span class="article__categories-label">${window.I18N.t("article.categories")}</span>
            <div class="chips">${tags}</div>
          </div>` : ""}
          <div class="article__foot">
            <a class="btn btn--ghost" href="blog.html">← ${window.I18N.t("post.back")}</a>
            <a class="article__top" href="#">↑ ${window.I18N.t("article.top")}</a>
          </div>
        </article>
      </div>

      ${related.length ? `
      <section class="section section--alt">
        <div class="wrap">
          <div class="section-head"><span class="kicker">${window.I18N.t("post.related")}</span></div>
          <div class="grid">
            ${related.map((r) => `
              <article class="card" data-reveal>
                <a href="post.html?slug=${encodeURIComponent(r.slug)}" class="card__media">
                  ${r.year ? `<span class="card__year">${r.year}</span>` : ""}
                  <img src="${r.cover || fallbackCover(r.year)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${fallbackCover(r.year)}'">
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
    wireCite(title, p, lang);
    wireTocHighlight();
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

  // Đánh dấu mục đang đọc trong mục lục
  function wireTocHighlight() {
    const links = [...document.querySelectorAll(".toc__list a")];
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = {};
    links.forEach((a) => { const id = a.getAttribute("href").slice(1); const el = document.getElementById(id); if (el) map[id] = a; });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.parentElement.classList.remove("active"));
          if (map[e.target.id]) map[e.target.id].parentElement.classList.add("active");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    Object.keys(map).forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  function wireShare(title) {
    const btn = document.getElementById("shareBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const url = location.href;
      if (navigator.share) { try { await navigator.share({ title, url }); } catch (e) {} }
      else { try { await navigator.clipboard.writeText(url); flash(btn, "✓"); } catch (e) {} }
    });
  }

  function wireCite(title, p, lang) {
    const btn = document.getElementById("citeBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      const site = (window.SITE_CONFIG.siteName || {})[lang] || "History";
      const citation = `${title}. ${site}. ${window.fmtDate(p.date, lang)}. ${location.href}`;
      try { await navigator.clipboard.writeText(citation); flash(btn, "✓ " + window.I18N.t("article.citecopied")); } catch (e) {}
    });
  }

  function flash(btn, text) {
    const span = btn.querySelector("span"); if (!span) return;
    const old = span.textContent; span.textContent = text;
    setTimeout(() => (span.textContent = old), 1600);
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
