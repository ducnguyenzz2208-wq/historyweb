/*
 * translator.js — Bộ dịch thuật tự động đa ngôn ngữ (VI ↔ EN)
 * Chạy được cả trong Trình duyệt (window) lẫn Node.js (build script).
 * 
 * Tính năng chính:
 * 1. Dịch chuỗi ngắn / đoạn văn qua Google Translate endpoint Chrome extension (fallback MyMemory).
 * 2. Dịch văn bản Markdown phức tạp mà BẢO TOÀN NGUYÊN VẸN:
 *    - Khối mã ```...``` và inline code `...`
 *    - Cú pháp ảnh Wikipedia: ![alt](url "caption |dir") (dịch alt & caption, giữ nguyên URL và |left / |right)
 *    - Cú pháp liên kết: [text](url) (chỉ dịch text, giữ nguyên URL)
 *    - Thẻ HTML và thực thể
 *    - Cú pháp chú thích nguồn: [^1] và [^1]: chú thích
 *    - Các cấp độ tiêu đề (#, ##, ###), danh sách (-, *), trích dẫn (>)
 */

const Translator = (function () {
  "use strict";

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * Dịch một mẩu văn bản thuần túy (plain text) từ ngôn ngữ `from` sang `to`.
   * Sử dụng Google Translate endpoint Chrome Extension với fallback sang MyMemory.
   */
  async function translateText(text, from = "vi", to = "en") {
    const trimmed = (text || "").trim();
    if (!trimmed) return "";
    if (from === to) return text;

    // 1. Thử Google Translate API (endpoint Chrome Extension có độ ổn định rất cao)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(trimmed)}`;
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      };
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translated = data[0].map((chunk) => chunk[0]).join("");
          if (translated && translated.trim() && translated.trim() !== ".") {
            return translated;
          }
        }
      }
    } catch (e) {
      console.warn("Google translate error, trying fallback...", e.message);
    }

    // 2. Fallback: MyMemory API (có lọc kết quả chuẩn từ matches)
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 500))}&langpair=${from}|${to}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.responseData && data.responseData.translatedText) {
          const trans = data.responseData.translatedText.trim();
          if (trans && trans !== "." && trans.length > 1) {
            return data.responseData.translatedText;
          }
        }
        if (Array.isArray(data.matches)) {
          const goodMatch = data.matches.find((m) => m.translation && m.translation.trim().length > 1 && m.translation.trim() !== ".");
          if (goodMatch) return goodMatch.translation;
        }
      }
    } catch (e) {
      console.warn("MyMemory translate error", e.message);
    }

    return text; // Giữ nguyên nếu các dịch vụ đều không có kết quả hợp lệ
  }

  /**
   * Dịch một khối Markdown hoàn chỉnh mà không làm hỏng cấu trúc.
   * @param {string} md - Nội dung Markdown gốc
   * @param {string} from - Ngôn ngữ nguồn ('vi' | 'en')
   * @param {string} to - Ngôn ngữ đích ('en' | 'vi')
   * @param {function} onProgress - Callback tiến độ: ({ done, total, percent, status })
   */
  async function translateMarkdown(md, from = "vi", to = "en", onProgress = null) {
    if (!md || from === to) return md;

    const notify = (done, total, status) => {
      if (typeof onProgress === "function") {
        onProgress({
          done,
          total,
          percent: total > 0 ? Math.round((done / total) * 100) : 0,
          status: status || "",
        });
      }
    };

    let text = md.replace(/\r\n?/g, "\n");
    const placeholders = [];
    const makeToken = (prefix, val) => {
      const token = `HW${prefix}${placeholders.length}`;
      placeholders.push({ token, val });
      return token;
    };

    // 1. Bảo vệ khối Code ```...```
    text = text.replace(/```[\s\S]*?```/g, (match) => makeToken("CODE", match));

    // 2. Bảo vệ Inline Code `...`
    text = text.replace(/`[^`\n]+`/g, (match) => makeToken("INLINE", match));

    // 3. Bảo vệ Thẻ HTML <...>
    text = text.replace(/<\/?[a-zA-Z][^>\n]*>/g, (match) => makeToken("HTML", match));

    // 4. Bảo vệ và xử lý Ảnh: ![alt](url "caption |dir")
    const imagesToTranslate = [];
    text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (match, alt, url, title) => {
      let caption = "";
      let dirDirective = "";
      if (title) {
        const m = title.match(/^(.*?)\s*(\|\s*(?:left|right))\s*$/i);
        if (m) {
          caption = m[1].trim();
          dirDirective = " " + m[2].trim();
        } else {
          caption = title.trim();
        }
      }
      const imgIdx = imagesToTranslate.length;
      imagesToTranslate.push({ alt, url, caption, dirDirective });
      return `HWIMG${imgIdx}`;
    });

    // 5. Bảo vệ và xử lý Liên kết: [text](url) -> giữ nguyên url, chỉ dịch text
    const linksToTranslate = [];
    text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, linkText, url) => {
      const linkIdx = linksToTranslate.length;
      linksToTranslate.push({ linkText, url });
      return `HWLINK${linkIdx}`;
    });

    // 6. Bảo vệ Footnote references [^1]
    text = text.replace(/\[\^([^\]]+)\]/g, (match) => makeToken("FNREF", match));

    // 7. Tách văn bản thành các đoạn (paragraphs) và gom thành các Chunks thông minh
    const rawParagraphs = text.split(/\n\n+/);
    const chunks = [];
    let currentChunk = [];
    let currentLen = 0;

    for (const p of rawParagraphs) {
      if (!p.trim()) continue;
      if (currentLen + p.length > 2200 && currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
        currentChunk = [p];
        currentLen = p.length;
      } else {
        currentChunk.push(p);
        currentLen += p.length + 2;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join("\n\n"));
    }

    const totalUnits = imagesToTranslate.length + linksToTranslate.length + chunks.length;
    let completedUnits = 0;

    notify(completedUnits, totalUnits, "Đang khởi tạo bản dịch...");

    // Dịch các đoạn text trong ảnh
    for (const img of imagesToTranslate) {
      if (img.alt) img.alt = await translateText(img.alt, from, to);
      if (img.caption) img.caption = await translateText(img.caption, from, to);
      completedUnits++;
      notify(completedUnits, totalUnits, "Đang dịch chú thích ảnh...");
    }

    // Dịch text trong liên kết
    for (const l of linksToTranslate) {
      if (l.linkText && !l.linkText.startsWith("HW")) {
        l.linkText = await translateText(l.linkText, from, to);
      }
      completedUnits++;
      notify(completedUnits, totalUnits, "Đang dịch liên kết...");
    }

    // 8. Dịch các khối văn bản (Chunks)
    const translatedChunks = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const translatedChunk = await translateText(chunk, from, to);
      translatedChunks.push(translatedChunk);
      completedUnits++;
      notify(completedUnits, totalUnits, `Đang dịch nội dung (${completedUnits}/${totalUnits})...`);
      if (i < chunks.length - 1) await sleep(50);
    }

    let result = translatedChunks.join("\n\n");

    const replaceInsensitive = (str, token, replacement) => {
      const reg = new RegExp(token, "gi");
      return str.replace(reg, () => replacement);
    };

    // 9. Khôi phục Liên kết
    for (let idx = 0; idx < linksToTranslate.length; idx++) {
      const { linkText, url } = linksToTranslate[idx];
      result = replaceInsensitive(result, `HWLINK${idx}`, `[${linkText}](${url})`);
    }

    // 10. Khôi phục Ảnh
    for (let idx = 0; idx < imagesToTranslate.length; idx++) {
      const { alt, url, caption, dirDirective } = imagesToTranslate[idx];
      let replacement = `![${alt}](${url})`;
      if (caption || dirDirective) {
        const fullTitle = `${caption || ""}${dirDirective || ""}`.trim();
        replacement = `![${alt}](${url} "${fullTitle}")`;
      }
      result = replaceInsensitive(result, `HWIMG${idx}`, replacement);
    }

    // 11. Khôi phục tất cả Placeholders còn lại theo thứ tự đảo ngược
    for (let i = placeholders.length - 1; i >= 0; i--) {
      const { token, val } = placeholders[i];
      result = replaceInsensitive(result, token, val);
    }

    notify(totalUnits, totalUnits, "Hoàn tất!");
    return result;
  }

  return {
    translateText,
    translateMarkdown,
  };
})();

if (typeof globalThis !== "undefined") globalThis.Translator = Translator;
if (typeof window !== "undefined") window.Translator = Translator;
