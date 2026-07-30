/*
 * md.js — bộ chuyển Markdown → HTML nhỏ gọn, không phụ thuộc thư viện ngoài.
 * Hỗ trợ: tiêu đề, đậm/nghiêng, liên kết, ảnh, danh sách, trích dẫn,
 * khối code, code inline, đường kẻ ngang, đoạn văn.
 */
/* Tạo slug (id) tiếng Việt cho tiêu đề — dùng cho mục lục/anchor.
   _used đặt lại mỗi lần mdToHtml chạy để id ổn định giữa các lần render. */
window.mdSlug = function (s) {
  const used = window.mdSlug._used || (window.mdSlug._used = {});
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
  src = src.replace(/\r\n?/g, "\n"); // chuẩn hóa CRLF/CR → LF (bài đăng qua admin thường là CRLF)
  window.mdSlug._used = {}; // đặt lại bộ đếm trùng id cho mỗi bài
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  /* ---------- Chú thích nguồn kiểu Wikipedia ----------
     [^1]        → <sup id="fnref:1"><a href="#fn:1">1</a></sup>
     [^1]: text  → gom vào danh sách "Nguồn tham khảo" ở cuối bài  */
  const footnotes = [];                       // [{ id, text }] theo thứ tự xuất hiện
  const fnIndex = {};                         // id gốc → số thứ tự hiển thị
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

  const inline = (t) =>
    t
      .replace(/\[\^([^\]]+)\]/g, (whole, id) => {
        const key = String(id).trim();
        const n = fnIndex[key];
        return n
          ? `<sup class="fn-ref" id="fnref:${n}"><a href="#fn:${n}">${n}</a></sup>`
          : whole;
      })
      .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/`([^`]+)`/g, (_, c) => `<code>${esc(c)}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

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
      html += `<h${lvl} id="${id}">${inline(esc(m[2]))}</h${lvl}>`;
      i++; continue;
    }
    if (/^\s*>\s?/.test(line)) {
      closeLists();
      let quote = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      html += `<blockquote>${inline(esc(quote.join(" ")))}</blockquote>`;
      continue;
    }
    if ((m = line.match(/^\s*[-*+]\s+(.*)$/))) {
      if (!inUl) { closeLists(); html += "<ul>"; inUl = true; }
      html += `<li>${inline(esc(m[1]))}</li>`;
      i++; continue;
    }
    if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
      if (!inOl) { closeLists(); html += "<ol>"; inOl = true; }
      html += `<li>${inline(esc(m[1]))}</li>`;
      i++; continue;
    }

    // Khung ảnh kiểu Wikipedia: dòng chỉ gồm 1 ảnh CÓ caption (title) → figure nổi.
    // Cú pháp: ![alt](url "Chú thích |left")  — hướng |left hoặc |right (mặc định phải).
    // Ảnh không có caption vẫn giữ hành vi cũ (rơi xuống xử lý đoạn văn).
    if ((m = line.trim().match(/^!\[([^\]]*)\]\(([^)\s]+)\s+"([^"]*)"\)$/))) {
      closeLists();
      const url = m[2];
      const alt = m[1] || "";
      let caption = m[3] || "";
      let dir = "right";
      const dm = caption.match(/^(.*?)\s*\|\s*(left|right)\s*$/i);
      if (dm) { caption = dm[1].trim(); dir = dm[2].toLowerCase(); }
      html += `<figure class="wiki-figure wiki-figure--${dir}">`
        + `<img class="wiki-figure__img" src="${url}" alt="${esc(alt)}" loading="lazy">`
        + `<figcaption class="wiki-figure__caption">${inline(esc(caption))}</figcaption>`
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
    html += `<p>${inline(esc(para.join(" ")))}</p>`;
  }
  closeLists();

  // khôi phục code blocks
  html = html.replace(/\u0000CODE(\d+)\u0000/g, (_, n) => codeBlocks[+n]);

  // Phần "Nguồn tham khảo" ở cuối bài
  if (footnotes.length) {
    const items = footnotes.map((f, i) => {
      const n = i + 1;
      return `<li id="fn:${n}">${inline(esc(f.text))} <a class="fn-back" href="#fnref:${n}" aria-label="Quay lại nội dung">↩</a></li>`;
    }).join("");
    html += `<hr><div class="footnotes"><ol>${items}</ol></div>`;
  }
  return html;
};
