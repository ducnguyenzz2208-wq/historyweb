#!/usr/bin/env node
/*
 * check-links.mjs — kiểm tra liên kết nội bộ & tài nguyên có tồn tại.
 * Quét các trang .html (href/src nội bộ) + các tệp .md khai báo trong index.json.
 * Thoát mã 1 nếu phát hiện liên kết hỏng (dùng cho CI).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";

let errors = [];
const htmlFiles = readdirSync(".").filter((f) => f.endsWith(".html"));

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (let ref of refs) {
    if (/^(https?:|data:|mailto:|#|\/\/)/.test(ref)) continue; // bỏ liên kết ngoài/anchor
    const path = ref.split("?")[0].split("#")[0];
    if (!path) continue;
    if (!existsSync(path)) errors.push(`${file}: thiếu tài nguyên → ${ref}`);
  }
}

// tệp .md khai báo trong index.json
for (const [idx, key] of [["posts/index.json", "posts"], ["figures/index.json", "figures"]]) {
  if (!existsSync(idx)) { errors.push(`thiếu ${idx}`); continue; }
  const data = JSON.parse(readFileSync(idx, "utf8"))[key] || [];
  for (const item of data) {
    if (item.file && !existsSync(item.file)) errors.push(`${idx}: thiếu tệp → ${item.file} (${item.slug})`);
  }
}

if (errors.length) {
  console.error("✗ Phát hiện " + errors.length + " liên kết/tài nguyên hỏng:");
  errors.forEach((e) => console.error("  - " + e));
  process.exit(1);
}
console.log("✓ Không có liên kết nội bộ hỏng (" + htmlFiles.length + " trang đã quét).");
