#!/usr/bin/env node
/*
 * build-feeds.mjs — sinh sitemap.xml, rss.xml, robots.txt từ dữ liệu bài viết & nhân vật.
 * Chạy: node scripts/build-feeds.mjs   (tự động chạy trong GitHub Actions trước khi deploy)
 */
import { readFileSync, writeFileSync } from "node:fs";

const cfg = readFileSync("config.js", "utf8");
const siteUrl = (cfg.match(/siteUrl:\s*["']([^"']+)["']/) || [])[1] || "https://example.com";
const base = siteUrl.replace(/\/$/, "");
const siteName = (cfg.match(/vi:\s*["']([^"']+)["']/) || [])[1] || "Dòng Chảy Lịch Sử";

const posts = JSON.parse(readFileSync("posts/index.json", "utf8")).posts || [];
const figures = JSON.parse(readFileSync("figures/index.json", "utf8")).figures || [];
const loc = (f, l) => (f && typeof f === "object" ? (f[l] || f.vi || f.en) : f) || "";
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));

const staticPages = ["index.html", "blog.html", "figures.html", "topics.html", "atlas.html", "gallery.html", "profile.html"];
const today = new Date().toISOString().slice(0, 10);

const urls = [
  ...staticPages.map((p) => ({ loc: `${base}/${p}`, lastmod: today, priority: p === "index.html" ? "1.0" : "0.7" })),
  ...posts.map((p) => ({ loc: `${base}/post.html?slug=${encodeURIComponent(p.slug)}`, lastmod: p.date || today, priority: "0.8" })),
  ...figures.map((f) => ({ loc: `${base}/figure.html?slug=${encodeURIComponent(f.slug)}`, lastmod: today, priority: "0.6" })),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join("\n")}
</urlset>
`;
writeFileSync("sitemap.xml", sitemap);

const items = posts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).map((p) => {
  const link = `${base}/post.html?slug=${encodeURIComponent(p.slug)}`;
  const pub = p.date ? new Date(p.date).toUTCString() : new Date().toUTCString();
  return `    <item>
      <title>${esc(loc(p.title, "vi"))}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${pub}</pubDate>
      <description>${esc(loc(p.excerpt, "vi"))}</description>
      ${(p.tags || []).map((t) => `<category>${esc(t)}</category>`).join("")}
    </item>`;
}).join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
    <title>${esc(siteName)}</title>
    <link>${esc(base)}/</link>
    <description>Thư viện lịch sử song ngữ Việt–Anh.</description>
    <language>vi</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</channel></rss>
`;
writeFileSync("rss.xml", rss);

writeFileSync("robots.txt", `User-agent: *
Allow: /
Disallow: /admin.html
Sitemap: ${base}/sitemap.xml
`);

console.log(`Built sitemap.xml (${urls.length} urls), rss.xml (${posts.length} items), robots.txt → base ${base}`);
