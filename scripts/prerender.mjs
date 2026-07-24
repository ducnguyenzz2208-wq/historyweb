#!/usr/bin/env node
/*
 * prerender.mjs — sinh HTML tĩnh cho từng sự kiện & nhân vật (SEO).
 * Crawler đọc được title/description/og ngay trong HTML, không cần chạy JS.
 * Chạy: node scripts/prerender.mjs   (tự chạy trong GitHub Actions trước khi deploy)
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const cfg = readFileSync("config.js", "utf8");
const pick = (re, dflt = "") => (cfg.match(re) || [])[1] || dflt;
const BASE = pick(/siteUrl:\s*["']([^"']+)["']/, "https://example.com").replace(/\/$/, "");
const SITE = pick(/vi:\s*["']([^"']+)["']/, "Dòng Chảy Lịch Sử");

const esc = (s) => String(s == null ? "" : s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const loc = (field, lang = "vi") =>
  !field ? "" : typeof field === "string" ? field : field[lang] || field.vi || field.en || "";

const readJson = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : {});

/** Đưa URL tương đối về tuyệt đối (og:image bắt buộc tuyệt đối). */
const absolute = (url) => (!url ? "" : /^https?:\/\//.test(url) ? url : `${BASE}/${url.replace(/^\//, "")}`);

/**
 * Chèn thẻ meta vào <head> của template và sửa đường dẫn tương đối
 * (trang nằm trong thư mục con nên cần lùi một cấp).
 */
function buildPage(template, meta) {
  let html = template;

  // Tài nguyên tương đối → lùi một cấp vì tệp nằm trong post/ hoặc figure/
  html = html.replace(/(src|href)="(?!https?:|data:|#|\/)/g, '$1="../');

  // Thay <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)} · ${esc(SITE)}</title>`);

  // Bỏ các thẻ meta sẽ được ghi đè để tránh trùng lặp
  html = html.replace(/\s*<meta name="description"[^>]*>/g, "")
             .replace(/\s*<meta property="og:(title|description|image|url|type)"[^>]*>/g, "")
             .replace(/\s*<link rel="canonical"[^>]*>/g, "");

  const tags = [
    `<meta name="description" content="${esc(meta.description)}">`,
    `<link rel="canonical" href="${meta.canonical}">`,
    `<meta property="og:type" content="article">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${meta.canonical}">`,
    meta.image ? `<meta property="og:image" content="${esc(meta.image)}">` : "",
    meta.image ? `<meta name="twitter:image" content="${esc(meta.image)}">` : "",
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
    // Trang thật vẫn chạy bằng JS qua ?slug= — chuyển hướng người dùng thường,
    // còn crawler đã có đủ meta ở trên.
    `<script>location.replace("${meta.appUrl}");</script>`,
    `<link rel="alternate" href="${meta.appUrl}">`,
  ].filter(Boolean).join("\n  ");

  return html.replace("</head>", `  ${tags}\n</head>`);
}

function jsonLd(kind, meta, extra) {
  return {
    "@context": "https://schema.org",
    "@type": kind,
    name: meta.title,
    headline: meta.title,
    description: meta.description,
    url: meta.canonical,
    ...(meta.image ? { image: meta.image } : {}),
    inLanguage: "vi",
    isPartOf: { "@type": "WebSite", name: SITE, url: BASE + "/" },
    ...extra,
  };
}

function write(dir, slug, html) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/${slug}.html`, html);
}

const postTpl = readFileSync("post.html", "utf8");
const figureTpl = readFileSync("figure.html", "utf8");

const posts = readJson("posts/index.json").posts || [];
const figures = readJson("figures/index.json").figures || [];

for (const p of posts) {
  const title = loc(p.title);
  const meta = {
    title,
    description: loc(p.excerpt) || `${title} — ${SITE}`,
    image: absolute(p.cover),
    canonical: `${BASE}/post/${p.slug}.html`,
    appUrl: `${BASE}/post.html?slug=${encodeURIComponent(p.slug)}`,
  };
  meta.jsonLd = jsonLd("Article", meta, {
    datePublished: p.date || undefined,
    keywords: (p.tags || []).join(", ") || undefined,
  });
  write("post", p.slug, buildPage(postTpl, meta));
}

for (const f of figures) {
  const name = loc(f.name);
  const meta = {
    title: name,
    description: loc(f.excerpt) || [loc(f.role), [f.born, f.died].filter(Boolean).join("–")].filter(Boolean).join(" · "),
    image: absolute(f.portrait),
    canonical: `${BASE}/figure/${f.slug}.html`,
    appUrl: `${BASE}/figure.html?slug=${encodeURIComponent(f.slug)}`,
  };
  meta.jsonLd = jsonLd("Person", meta, {
    jobTitle: loc(f.role) || undefined,
    birthDate: f.born || undefined,
    deathDate: f.died || undefined,
  });
  write("figure", f.slug, buildPage(figureTpl, meta));
}

console.log(`Prerendered ${posts.length} post/ + ${figures.length} figure/ pages → base ${BASE}`);
