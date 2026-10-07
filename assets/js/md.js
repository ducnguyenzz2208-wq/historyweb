/*
 * md.js — bộ chuyển Markdown → HTML nhỏ gọn, không phụ thuộc thư viện ngoài.
 * Hỗ trợ: tiêu đề, đậm/nghiêng, liên kết, ảnh, danh sách, trích dẫn,
 * khối code, code inline, đường kẻ ngang, đoạn văn.
 */
/* Tạo slug (id) tiếng Việt cho tiêu đề — dùng cho mục lục/anchor.
   _used đặt lại mỗi lần mdToHtml chạy để id ổn định giữa các lần render. */
window.hwEscapeHtml = function (s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;")
    .replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

// Allow web links and local paths; image previews may use raster base64 data.
// SVG/HTML data, blob, protocol-relative URLs and control characters are rejected.
window.hwMarkdownUrl = function (value, image = false) {
  const url = String(value || "");
  if (!url || /[\u0000-\u0020\u007f-\u009f\\]/.test(url) || url.startsWith("//")) return "";
  if (/^data:/i.test(url)) {
    return image && /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp|x-icon);base64,[a-z0-9+/=]+$/i.test(url) ? url : "";
  }
  try {
    const parsed = new URL(url, "https://markdown.invalid/");
    if (["http:", "https:"].includes(parsed.protocol)) return url;
    if (!image && parsed.protocol === "mailto:") return url;
  } catch (_) { /* Invalid URLs render as plain text. */ }
  return "";
};

window.mdSlug = function (s) {
  const used = window.mdSlug._used || (window.mdSlug._used = Object.create(null));
  let base = (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-") || "muc";
  if (used[base] == null) { used[base] = 0; return base; }
  used[base] += 1; return base + "-" + used[base];
};

window.mdToHtml = function (src) {
  if (!src) return "";
  src = String(src).replace(/\u0000/g, "").replace(/\r\n?/g, "\n");
  window.mdSlug._used = Object.create(null);
  const esc = window.hwEscapeHtml;

  /* ---------- Chú thích nguồn kiểu Wikipedia ----------
     [^1]        → <sup id="fnref:1"><a href="#fn:1">1</a></sup>
     [^1]: text  → gom vào danh sách "Nguồn tham khảo" ở cuối bài  */
  const footnotes = [];                       // [{ id, text }] theo thứ tự xuất hiện
  const fnIndex = Object.create(null);        // id gốc → số thứ tự hiển thị
  src = src.replace(/^[ \t]*\[\^([^\]]+)\]:[ \t]*(.+(?:\n(?![ \t]*\[\^)[^\n]+)*)/gm, (_, id, text) => {
    footnotes.push({ id: String(id).trim(), text: text.trim().replace(/\s*\n\s*/g, " ") });
    return "";
  });
  footnotes.forEach((f, i) => (fnIndex[f.id] = i + 1));

  // tách và giữ code block trước
  const codeBlocks = [];
  src = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(`<pre><code>${esc(code.replace(/\n$/, ""))}</code></pre>`);
    return `\u0000CODE${codeBlocks.length - 1}\u0000`;
  });

  const inline = (text) => {
    // Protect generated tags and code before applying emphasis. Markdown in a
    // URL/alt/code must never be interpreted as markup inside an HTML attribute.
    const tokens = [];
    const keep = (html) => { tokens.push(html); return `\u0000INLINE${tokens.length - 1}\u0000`; };
    let t = text.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${esc(code)}</code>`));
    t = t.replace(/!?\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (whole, label, value) => {
      const image = whole.startsWith("!");
      const url = window.hwMarkdownUrl(value, image);
      if (!url) return keep(esc(label));
      return keep(image
        ? `<img src="${esc(url)}" alt="${esc(label)}" loading="lazy">`
        : `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)}</a>`);
    });
    t = esc(t)
      .replace(/\[\^([^\]]+)\]/g, (whole, id) => {
        const key = String(id).trim();
        const n = fnIndex[key];
        return n
          ? `<sup class="fn-ref" id="fnref:${n}"><a href="#fn:${n}">${n}</a></sup>`
          : whole;
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");
    return t.replace(/\u0000INLINE(\d+)\u0000/g, (_, n) => tokens[+n]);
  };

  const lines = src.split("\n");
  let html = "";
  let i = 0;
  let inUl = false, inOl = false;
  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
  };

  while (i < lines.length) {
    let line = lines[i];

    if (/^\u0000CODE\d+\u0000$/.test(line.trim())) { closeLists(); html += line.trim(); i++; continue; }
    if (/^\s*$/.test(line)) { closeLists(); i++; continue; }
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) { closeLists(); html += "<hr>"; i++; continue; }

    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) {
      closeLists();
      const lvl = m[1].length;
      const id = window.mdSlug(m[2]);
      html += `<h${lvl} id="${id}">${inline(m[2])}</h${lvl}>`;
      i++; continue;
    }
    if (/^\s*>\s?/.test(line)) {
      closeLists();
      let quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      html += `<blockquote>${inline(quote.join(" "))}</blockquote>`;
      continue;
    }
    if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      if (!inUl) { closeLists(); html += "<ul>"; inUl = true; }
      html += `<li>${inline(m[1])}</li>`;
      i++; continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      if (!inOl) { closeLists(); html += "<ol>"; inOl = true; }
      html += `<li>${inline(m[1])}</li>`;
      i++; continue;
    }

    // Khung ảnh kiểu Wikipedia: dòng chỉ gồm 1 ảnh CÓ caption (title) → figure nổi.
    // Cú pháp: ![alt](url "Chú thích |left")  — hướng |left hoặc |right (mặc định phải).
    // Ảnh không có caption vẫn giữ hành vi cũ (rơi xuống xử lý đoạn văn).
    if ((m = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\s+"([^"]*)"\)$/))) {
      closeLists();
      const url = window.hwMarkdownUrl(m[2], true);
      const alt = m[1] || "";
      let caption = m[3] || "";
      let dir = "right";
      const dm = caption.match(/^(.*?)\s*\|\s*(left|right)\s*$/i);
      if (dm) { caption = dm[1].trim(); dir = dm[2].toLowerCase(); }
      html += `<figure class="wiki-figure wiki-figure--${dir}">`
        + (url ? `<img class="wiki-figure__img" src="${esc(url)}" alt="${esc(alt)}" loading="lazy">` : esc(alt))
        + `<figcaption class="wiki-figure__caption">${inline(caption)}</figcaption>`
        + `</figure>`;
      i++; continue;
    }

    // paragraph (gộp các dòng liên tiếp)
    closeLists();
    let para = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|\s*>|\s*[-*+]\s|\s*\d+\.\s|\u0000CODE)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    html += `<p>${inline(para.join(" "))}</p>`;
  }
  closeLists();

  // khôi phục code blocks
  html = html.replace(/\u0000CODE(\d+)\u0000/g, (_, n) => codeBlocks[+n]);

  // Phần "Nguồn tham khảo" ở cuối bài
  if (footnotes.length) {
    const items = footnotes.map((f, i) => {
      const n = i + 1;
      return `<li id="fn:${n}">${inline(f.text)} <a class="fn-back" href="#fnref:${n}" aria-label="Quay lại nội dung">↩</a></li>`;
    }).join("");
    html += `<hr><div class="footnotes"><ol>${items}</ol></div>`;
  }
  return html;
};
