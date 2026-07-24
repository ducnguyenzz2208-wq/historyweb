/*
 * post.js — render một bài viết theo phong cách trang báo / bách khoa (Wikipedia):
 * dòng dẫn (byline), infobox tra cứu, mục lục tự động, nội dung, nguồn tham khảo,
 * chuyên mục, thanh tiến trình đọc và nút "Sửa bài viết".
 */
(function () {
  "use strict";

  function getSlug() { return new URLSearchParams(location.search).get("slug"); }

  const fallbackCover = (year) => window.hwPlaceholder(year || "H", 1600, 900);

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
          <img src="${p.cover || fb}" alt="${Store.localized(p.title, lang)}" data-fallback="${window.hwFallback(p.cover, fb)}">
        </div>
        <div class="infobox__title">${window.I18N.t("article.infobox")}</div>
        <dl class="infobox__list">
          ${p.verified ? `<div class="infobox__row"><dt>${window.I18N.t("article.status")}</dt><dd><span class="verified-badge" title="${window.I18N.t("article.verifiedhint")}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>${window.I18N.t("article.verified")}</span></dd></div>` : ""}
          ${row(window.I18N.t("article.region"), regionLabel)}
          ${row(window.I18N.t("figure.era"), p.era ? Store.localized(p.era, lang) : "")}
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
    if (window.hwMeta) window.hwMeta({ title, description: excerpt, image: p.cover || undefined });

    const bodyHtml = window.mdToHtml(currentBody);
    const toc = buildToc(bodyHtml);
    const tags = (p.tags || []).map((t) => `<a class="chip" href="blog.html?tag=${encodeURIComponent(t)}">${t}</a>`).join("");

    // Liên kết cộng đồng: lịch sử sửa đổi + góp ý (GitHub)
    const cfg = window.SITE_CONFIG || {};
    const repo = `${cfg.repoOwner}/${cfg.repoName}`;
    const branch = cfg.branch || "main";
    const author = (cfg.profile && cfg.profile.name) || (cfg.siteName || {})[lang] || "";
    const historyUrl = `https://github.com/${repo}/commits/${branch}/posts/${p.slug}.md`;
    const correctionUrl = `https://github.com/${repo}/issues/new?title=${encodeURIComponent("[Góp ý] " + title)}&body=${encodeURIComponent("Trang: " + location.href + "\n\nGóp ý / nguồn tham khảo:\n")}`;

    const related = (await Store.all())
      .filter((x) => x.slug !== p.slug && (x.tags || []).some((t) => (p.tags || []).includes(t)))
      .slice(0, 3);

    root.innerHTML = `
      <div class="progress-bar" id="progressBar"></div>
      <section class="post-hero">
        <div class="post-hero__bg"><img src="${p.cover || fallbackCover(p.year)}" alt="" data-fallback="${window.hwFallback(p.cover, fallbackCover(p.year))}"></div>
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
          <div class="article__byline">
            <a class="article__author" href="profile.html">
              <span class="article__author-mark">${(author || "H").trim().charAt(0)}</span>
              <span>${window.I18N.t("article.by")} <b>${author}</b></span>
            </a>
            <span class="article__byline-date">${window.fmtDate(p.date, lang)}</span>
          </div>
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
            <a class="article__tool" href="${historyUrl}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v5h5M3.05 13a9 9 0 106-8.5L3 8"/><path d="M12 7v5l3 2"/></svg>
              <span>${window.I18N.t("article.history")}</span>
            </a>
            <a class="article__tool" href="${correctionUrl}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/></svg>
              <span>${window.I18N.t("article.correction")}</span>
            </a>
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

          <section class="comments" id="comments">
            <h2 class="comments__title">${window.I18N.t("comments.title")}</h2>
            <div id="giscusMount"></div>
            <p class="comments__fallback" id="commentsFallback">
              ${window.I18N.t("comments.setup")}
              <a href="${correctionUrl}" target="_blank" rel="noopener">${window.I18N.t("article.correction")} →</a>
            </p>
          </section>
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
                  <img src="${r.cover || fallbackCover(r.year)}" alt="" loading="lazy" data-fallback="${window.hwFallback(r.cover, fallbackCover(r.year))}">
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
    wireComments(lang);
    if (window.hwReveal) window.hwReveal();
    window.scrollTo(0, 0);
  }

  // Bình luận Giscus (chỉ tải khi đã bật & cấu hình trong config.js)
  function wireComments(lang) {
    const c = (window.SITE_CONFIG || {}).comments || {};
    const mount = document.getElementById("giscusMount");
    const fallback = document.getElementById("commentsFallback");
    if (!mount || !c.enabled || !c.repoId || !c.categoryId) return;
    if (fallback) fallback.style.display = "none";
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true; s.crossOrigin = "anonymous";
    s.setAttribute("data-repo", c.repo);
    s.setAttribute("data-repo-id", c.repoId);
    s.setAttribute("data-category", c.category || "Announcements");
    s.setAttribute("data-category-id", c.categoryId);
    s.setAttribute("data-mapping", "pathname");
    s.setAttribute("data-reactions-enabled", "1");
    s.setAttribute("data-theme", document.documentElement.getAttribute("data-theme") === "dark" ? "dark_dimmed" : "light");
    s.setAttribute("data-lang", lang === "en" ? "en" : "vi");
    mount.appendChild(s);
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

  // Sinh trích dẫn chuẩn APA / MLA / Chicago
  function citations(title, p, lang) {
    const cfg = window.SITE_CONFIG || {};
    const site = (cfg.siteName || {})[lang] || "History";
    const author = (cfg.profile && cfg.profile.name) || site;
    const url = location.href;
    const d = new Date(p.date);
    const year = isNaN(d) ? (p.date || "") : d.getFullYear();
    const monthName = isNaN(d) ? "" : d.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", { month: "long" });
    const day = isNaN(d) ? "" : d.getDate();
    const accessed = window.fmtDate(new Date().toISOString().slice(0, 10), lang);
    return {
      APA: `${author}. (${year}). ${title}. ${site}. ${url}`,
      MLA: `${author}. “${title}.” ${site}, ${day} ${monthName} ${year}, ${url}.`,
      Chicago: `${author}. “${title}.” ${site}. ${window.fmtDate(p.date, lang)}. ${url}.`,
    };
  }

  function wireCite(title, p, lang) {
    const btn = document.getElementById("citeBtn");
    if (!btn) return;
    btn.addEventListener("click", () => openCiteModal(title, p, lang));
  }

  function openCiteModal(title, p, lang) {
    const cites = citations(title, p, lang);
    document.getElementById("citeModal")?.remove();
    const el = document.createElement("div");
    el.id = "citeModal";
    el.className = "cite-modal open";
    el.innerHTML = `
      <div class="cite-modal__panel glass" role="dialog" aria-modal="true" aria-label="${window.I18N.t("cite.title")}">
        <div class="cite-modal__head">
          <h3>${window.I18N.t("cite.title")}</h3>
          <button class="cite-modal__close" aria-label="${window.I18N.t("cite.close")}">✕</button>
        </div>
        ${Object.entries(cites).map(([style, text]) => `
          <div class="cite-row">
            <div class="cite-row__head"><span class="cite-row__style">${style}</span>
              <button class="cite-row__copy" data-text="${text.replace(/"/g, "&quot;")}">${window.I18N.t("cite.copy")}</button>
            </div>
            <p class="cite-row__text">${text.replace(/</g, "&lt;")}</p>
          </div>`).join("")}
      </div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.addEventListener("click", (e) => { if (e.target === el) close(); });
    el.querySelector(".cite-modal__close").addEventListener("click", close);
    el.querySelectorAll(".cite-row__copy").forEach((b) => b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.text); const o = b.textContent; b.textContent = "✓ " + window.I18N.t("cite.copied"); setTimeout(() => (b.textContent = o), 1500); } catch (e) {}
    }));
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
  }

  function flash(btn, text) {
    const span = btn.querySelector("span"); if (!span) return;
    const old = span.textContent; span.textContent = text;
    setTimeout(() => (span.textContent = old), 1600);
  }

  document.addEventListener("DOMContentLoaded", render);
  window.addEventListener("langchange", render);
})();
