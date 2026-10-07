/* Full static articles; English uses .en.html alongside existing Vietnamese URLs. */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import vm from "node:vm";
const context = vm.createContext({ window: {}, URL });
for (const file of ["config.js", "assets/js/md.js"]) vm.runInContext(readFileSync(file, "utf8"), context);
const cfg = context.window.SITE_CONFIG, BASE = cfg.siteUrl.replace(/\/$/, "");
const esc = context.window.hwEscapeHtml, safe = context.window.hwMarkdownUrl;
const loc = (field, lang) => typeof field === "object" && field ? field[lang] || field.vi || field.en || "" : field || "";
const pathFor = (kind, slug, lang) => `${kind}/${slug}${lang === "en" ? ".en" : ""}.html`;
const audit = existsSync("assets/data/source-audit.json") ? JSON.parse(readFileSync("assets/data/source-audit.json")) : { items: [] };
let count = 0;
for (const [kind, dir, key] of [["post", "posts", "title"], ["figure", "figures", "name"]]) {
  const list = JSON.parse(readFileSync(`${dir}/index.json`))[dir];
  mkdirSync(kind, { recursive: true });
  for (const item of list) {
    if (!/^[a-z0-9-]+$/.test(item.slug)) throw new Error(`Invalid slug: ${item.slug}`);
    const entry = audit.items.find(x => x.kind === kind && x.slug === item.slug);
    for (const lang of ["vi", "en"]) {
      const en = lang === "en", self = pathFor(kind, item.slug, lang), canonical = `${BASE}/${self}`;
      const file = item.files?.[lang] || (item.lang === lang || !en ? item.file : null);
      const available = !!file && existsSync(file), fallback = item.files?.vi || item.file;
      if (!available && !existsSync(fallback)) throw new Error(`Missing body: ${kind}/${item.slug}`);
      const title = loc(item[key], lang), description = loc(item.excerpt, lang) || loc(item.role, lang);
      const markdown = readFileSync(available ? file : fallback, "utf8")
        .replace(/^#\s+[^\r\n]*(?:\r?\n|$)/m, "")
        .replace(/^# /gm, "## ");
      const body = context.window.mdToHtml(markdown).replace(/href="#([^"]*)"/g, (_, id) => `href="${self}#${id}"`);
      const headings = [...body.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)];
      const toc = headings.map((h, i) => `<li><a href="${self}#${h[2]}">${i + 1}. ${h[3].replace(/<[^>]*>/g, "").replace(/^\d+\.\s*/, "")}</a></li>`).join("");
      const image = safe(item.cover || item.portrait || "", true);
      const refs = (entry?.sources || []).filter(s => !s.file || s.file === (available ? file : fallback)).map(s => `<li>${safe(s.url || "") ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>` : esc(s.label)}</li>`).join("");
      const credit = item.imageSource?.status === "unverified" && en ? "Image provenance and license unverified" : item.credit || "";
      const citations = {
        apa: `${cfg.profile?.name || loc(cfg.siteName, lang)}. (${item.date || "n.d."}). ${title}. ${loc(cfg.siteName, lang)}. ${canonical}`,
        mla: `${cfg.profile?.name || loc(cfg.siteName, lang)}. “${title}.” ${loc(cfg.siteName, lang)}, ${item.date || "n.d."}, ${canonical}.`,
        chicago: `${cfg.profile?.name || loc(cfg.siteName, lang)}. “${title}.” ${loc(cfg.siteName, lang)}. ${item.date || "n.d."}. ${canonical}.`,
      };
      const related = list.filter(x => x.slug !== item.slug && (x.tags || []).some(t => (item.tags || []).includes(t))).slice(0, 3);
      const content = `
        <section class="post-hero"><div class="wrap post-hero__inner">
          <a class="kicker" href="${kind === "post" ? "blog" : "figures"}.html">← ${en ? "Back to list" : "Quay lại danh sách"}</a>
          <div class="post-hero__year">${esc(item.year || item.born || "")}</div><h1>${esc(title)}</h1><p>${esc(description)}</p>
          <nav aria-label="Language"><a href="${pathFor(kind, item.slug, "vi")}" hreflang="vi">Tiếng Việt</a> · <a href="${pathFor(kind, item.slug, "en")}" hreflang="en">English</a></nav>
        </div></section>
        <div class="article-layout"><aside class="article-layout__aside"><nav class="toc glass" aria-label="${en ? "Contents" : "Mục lục"}"><div class="toc__title">${en ? "Contents" : "Mục lục"}</div><ol>${toc}</ol></nav></aside>
        <article class="article article--wiki">
          <nav aria-label="Breadcrumb"><a href="index.html">${en ? "Home" : "Trang chủ"}</a> › <a href="${kind === "post" ? "blog" : "figures"}.html">${en ? "Library" : "Thư viện"}</a> › ${esc(title)}</nav>
          <p class="article__byline">${en ? "Compiled by" : "Biên soạn bởi"} <a href="profile.html">${esc(cfg.profile?.name)}</a></p>
          <div class="static-tools"><details><summary>${en ? "Cite this page" : "Trích dẫn trang này"}</summary>
            <label for="staticCitationStyle">${en ? "Citation style" : "Kiểu trích dẫn"}</label><select id="staticCitationStyle"><option value="apa">APA</option><option value="mla">MLA</option><option value="chicago">Chicago</option></select>
            <p id="staticCitation" data-apa="${esc(citations.apa)}" data-mla="${esc(citations.mla)}" data-chicago="${esc(citations.chicago)}">${esc(citations.apa)}</p>
            <button class="btn btn--ghost" id="staticCopyCitation">${en ? "Copy" : "Sao chép"}</button></details>
            <button class="btn btn--ghost" id="staticShare">${en ? "Share" : "Chia sẻ"}</button>
            <a href="https://github.com/${cfg.repoOwner}/${cfg.repoName}/issues/new?title=${encodeURIComponent('[Góp ý] '+title)}&amp;body=${encodeURIComponent(canonical)}">${en ? "Suggest a correction" : "Góp ý / Báo lỗi nguồn"}</a></div>
          <aside class="infobox glass">${image ? `<img src="${esc(image)}" alt="${esc(title)}" loading="lazy" style="width:100%">` : ""}
            <div class="infobox__title">${en ? "Quick facts" : "Thông tin nhanh"}</div><dl>
            <dt>${en ? "Region" : "Khu vực"}</dt><dd>${item.region === "vietnam" ? (en ? "Vietnam" : "Việt Nam") : (en ? "World" : "Thế giới")}</dd>
            <dt>${en ? "Period / role" : "Thời kỳ / vai trò"}</dt><dd>${esc(loc(item.era || item.role, lang))}</dd>
            <dt>${en ? "Date" : "Mốc thời gian"}</dt><dd>${esc(item.year || [item.born, item.died].filter(Boolean).join("–"))}</dd>
            <dt>${en ? "Status" : "Trạng thái"}</dt><dd>${en ? "Awaiting editorial review" : "Chờ đối chiếu biên tập"}</dd></dl><p>${esc(credit)}</p>
            ${safe(item.imageSource?.sourcePage || "") ? `<a href="${esc(item.imageSource.sourcePage)}">${en ? "Image source" : "Trang nguồn ảnh"}</a>` : ""}
            ${safe(item.imageSource?.licenseUrl || "") ? `<a href="${esc(item.imageSource.licenseUrl)}">${esc(item.imageSource.license)}</a>` : ""}</aside>
          ${available ? "" : '<p role="status">English translation unavailable. The original Vietnamese text is shown below.</p>'}
          <div class="prose" ${available ? "" : 'lang="vi"'}>${body}</div>
          <section class="source-review"><h2>${en ? "Sources and editorial review" : "Nguồn và đối chiếu biên tập"}</h2>
            <p>${en ? "References are listed for review; their presence does not verify every claim." : "Danh mục nguồn phục vụ đối chiếu; có tài liệu tham khảo không đồng nghĩa mọi nhận định đã được kiểm chứng."}</p>
            <ul>${refs}</ul><a href="SOURCE_AUDIT.md">${en ? "Audit report" : "Báo cáo nguồn và ảnh"}</a></section>
          <p><a href="admin.html?${kind === "figure" ? "type=figure&" : ""}slug=${item.slug}">${en ? "Edit" : "Sửa bài"}</a> · <a href="https://github.com/${cfg.repoOwner}/${cfg.repoName}/commits/${cfg.branch}/${esc(available ? file : fallback)}">${en ? "Revision history" : "Lịch sử sửa đổi"}</a></p>
          <div class="article__categories">${(item.tags || []).map(t => `<a class="chip" href="topics.html?tag=${encodeURIComponent(t)}">${esc(t)}</a>`).join(" ")}</div>
          <section><h2>${en ? "Related reading" : "Bài liên quan"}</h2><ul>${related.map(x => `<li><a href="${pathFor(kind, x.slug, lang)}">${esc(loc(x[key], lang))}</a></li>`).join("")}</ul></section>
          <p><a href="${self}#staticRoot">↑ ${en ? "Back to top" : "Về đầu trang"}</a></p>
        </article></div>`;
      let html = readFileSync(`${kind}.html`, "utf8")
        .replace('<html lang="vi"', `<html lang="${lang}"`)
        .replace("<head>", '<head>\n  <base href="../">')
        .replace('</head>', '<link rel="stylesheet" href="assets/css/static.css?v=20261008-p0">\n</head>')
        .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)} · ${esc(loc(cfg.siteName, lang))}</title>`)
        .replace(/<main id="(?:post|figure)Root"><\/main>/, () => `<div class="progress-bar" id="staticProgress"></div><main id="staticRoot">${content}</main>`)
        .replace(/<script src="assets\/js\/(?:post|figure|figures|translator)\.js(?:\?[^"\s]*)?"><\/script>/g, "")
        .replace(/<script src="assets\/js\/main\.js[^"\s]*">/, '<script src="assets/js/static-page.js?v=20261008-p0"></script>\n  <script src="assets/js/main.js?v=20261008-p0">')
        .replace('<div id="header-slot"></div>', `<div id="header-slot"><header class="site-header"><nav class="wrap nav"><a class="brand" href="index.html">${esc(loc(cfg.siteName, lang))}</a><a href="blog.html">${en ? "Articles" : "Bài viết"}</a><a href="figures.html">${en ? "Figures" : "Nhân vật"}</a></nav></header></div>`)
        .replace('<div id="footer-slot"></div>', `<footer id="footer-slot" class="wrap"><a href="index.html">${esc(loc(cfg.siteName, lang))}</a></footer>`);
      const jsonLd = { "@context": "https://schema.org", "@type": kind === "post" ? "Article" : "Person", name: title, description, url: canonical, inLanguage: available ? lang : "vi", ...(image ? { image: new URL(image, BASE + "/").href } : {}), ...(kind === "post" && item.date ? { datePublished: item.date } : {}) };
      const meta = `
        <meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}">
        <link rel="alternate" hreflang="vi" href="${BASE}/${pathFor(kind, item.slug, "vi")}"><link rel="alternate" hreflang="en" href="${BASE}/${pathFor(kind, item.slug, "en")}">
        <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}">
        ${image ? `<meta property="og:image" content="${esc(new URL(image, BASE + "/").href)}">` : ""}
        <meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
        <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`;
      const result = html.replace("</head>", () => `${meta}\n</head>`).replace(/[ \t]+$/gm, "");
      writeFileSync(self, result); count++;
    }
  }
}
console.log(`Built ${count} full static article pages (VI + EN).`);
