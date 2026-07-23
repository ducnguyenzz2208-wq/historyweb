/*
 * admin.js — trang quản trị: viết/sửa/xóa bài và commit thẳng lên repo qua GitHub API.
 * Token chỉ lưu trong localStorage của trình duyệt, không gửi đi đâu khác ngoài api.github.com.
 */
(function () {
  "use strict";
  const cfg = window.SITE_CONFIG || {};
  const API = "https://api.github.com";
  const REPO = `${cfg.repoOwner}/${cfg.repoName}`;
  const BRANCH = cfg.branch || "main";
  const TOKEN_KEY = "hw_gh_token";

  const $ = (id) => document.getElementById(id);
  const token = () => localStorage.getItem(TOKEN_KEY) || "";

  /* ---------- base64 UTF-8 ---------- */
  const b64encode = (s) => btoa(unescape(encodeURIComponent(s)));
  const b64decode = (s) => decodeURIComponent(escape(atob(s.replace(/\n/g, ""))));

  /* ---------- GitHub API ---------- */
  async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      cache: "no-store", // luôn lấy sha mới nhất, tránh lỗi 409 do trình duyệt cache
      headers: {
        Authorization: "token " + token(),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.headers || {}),
      },
    });
    if (!res.ok) {
      let msg = res.status + " " + res.statusText;
      try { const j = await res.json(); if (j.message) msg = j.message; } catch (e) {}
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  const apiPath = (p) => `/repos/${REPO}/contents/${encodeURIComponent(p).replace(/%2F/g, "/")}`;

  async function getFile(filePath) {
    try {
      return await gh(apiPath(filePath) + `?ref=${BRANCH}&_=${Date.now()}`);
    } catch (e) {
      return null; // chưa tồn tại
    }
  }

  // Ghi tệp (base64 sẵn) + tự thử lại 1 lần nếu 409 (sha cũ) bằng sha mới nhất
  async function putRaw(filePath, base64, message, sha) {
    const body = { message, content: base64, branch: BRANCH };
    if (sha) body.sha = sha;
    try {
      return await gh(apiPath(filePath), { method: "PUT", body: JSON.stringify(body) });
    } catch (e) {
      if (e.status === 409) {
        const fresh = await getFile(filePath);
        const body2 = { message, content: base64, branch: BRANCH };
        if (fresh && fresh.sha) body2.sha = fresh.sha;
        return gh(apiPath(filePath), { method: "PUT", body: JSON.stringify(body2) });
      }
      throw e;
    }
  }

  async function putFile(filePath, contentStr, message, sha) {
    return putRaw(filePath, b64encode(contentStr), message, sha);
  }

  async function deleteFile(filePath, message, sha) {
    return gh(`/repos/${REPO}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`, {
      method: "DELETE",
      body: JSON.stringify({ message, sha, branch: BRANCH }),
    });
  }

  /* ---------- status ---------- */
  function setStatus(msg, kind) {
    const el = $("statusMsg");
    el.textContent = msg;
    el.className = "status-msg " + (kind || "");
  }

  /* ---------- slug ---------- */
  function slugify(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim().replace(/\s+/g, "-").replace(/-+/g, "-")
      .slice(0, 80) || "bai-viet";
  }

  /* ---------- token ---------- */
  function initToken() {
    const input = $("tokenInput");
    if (token()) input.value = token();
    $("saveToken").addEventListener("click", () => {
      const v = input.value.trim();
      if (!v) { setStatus(window.I18N.t("admin.needtoken"), "err"); return; }
      localStorage.setItem(TOKEN_KEY, v);
      setStatus(window.I18N.t("admin.tokensaved"), "ok");
      connect();
    });
    $("connectBtn").addEventListener("click", connect);
  }

  async function connect() {
    if (!token()) { setStatus(window.I18N.t("admin.needtoken"), "err"); return; }
    setStatus("…");
    try {
      const me = await gh("/user");
      $("connInfo").innerHTML = `<span class="badge">● ${window.I18N.t("admin.connected")} ${me.login}</span> <span class="badge" style="background:color-mix(in srgb,var(--gold) 18%,transparent);color:var(--gold)">${REPO} · ${BRANCH}</span>`;
      setStatus("", "");
      loadPostList();
    } catch (e) {
      setStatus(window.I18N.t("admin.error") + " " + e.message, "err");
    }
  }

  /* ---------- danh sách bài để sửa ---------- */
  async function loadPostList() {
    const sel = $("loadSelect");
    if (!sel) return;
    try {
      const res = await fetch("posts/index.json?_=" + Date.now());
      const data = res.ok ? await res.json() : { posts: [] };
      const posts = data.posts || [];
      sel.innerHTML = `<option value="">— ${window.I18N.t("admin.new")} —</option>` +
        posts.map((p) => `<option value="${p.slug}">${(p.year ? p.year + " · " : "")}${Store.localized(p.title, window.I18N.lang)}</option>`).join("");
    } catch (e) {
      sel.innerHTML = `<option value="">— ${window.I18N.t("admin.new")} —</option>`;
    }
  }

  async function loadPost(slug) {
    if (!slug) { resetForm(); return; }
    setStatus("…");
    try {
      const res = await fetch("posts/index.json?_=" + Date.now());
      const data = await res.json();
      const p = (data.posts || []).find((x) => x.slug === slug);
      if (!p) { setStatus("?", "err"); return; }
      const lang = window.I18N.lang;
      $("f_title").value = Store.localized(p.title, lang);
      $("f_slug").value = p.slug;
      $("f_slug").dataset.locked = "1";
      $("f_date").value = p.date || "";
      $("f_year").value = p.year || "";
      if ($("f_region")) $("f_region").value = p.region || "vietnam";
      $("f_tags").value = (p.tags || []).join(", ");
      $("f_cover").value = p.cover || "";
      $("f_excerpt").value = Store.localized(p.excerpt, lang);
      $("f_lang").value = p.lang || lang;
      const md = await (await fetch(p.file + "?_=" + Date.now())).text();
      $("f_content").value = md;
      setStatus("", "");
      $("deleteBtn").style.display = "inline-flex";
    } catch (e) {
      setStatus(window.I18N.t("admin.error") + " " + e.message, "err");
    }
  }

  function resetForm() {
    ["f_title", "f_slug", "f_year", "f_tags", "f_cover", "f_excerpt", "f_content"].forEach((id) => ($(id).value = ""));
    $("f_date").value = new Date().toISOString().slice(0, 10);
    if ($("f_region")) $("f_region").value = "vietnam";
    $("f_slug").dataset.locked = "";
    $("deleteBtn").style.display = "none";
    $("previewBox").innerHTML = "";
    if ($("loadSelect")) $("loadSelect").value = "";
  }

  /* ---------- xuất bản ---------- */
  async function publish() {
    if (!token()) { setStatus(window.I18N.t("admin.needtoken"), "err"); return; }
    const title = $("f_title").value.trim();
    const content = $("f_content").value.trim();
    if (!title || !content) { setStatus(window.I18N.t("admin.needfields"), "err"); return; }

    const slug = ($("f_slug").value.trim() || slugify(title));
    const lang = $("f_lang").value || "vi";
    const post = {
      slug,
      title: { [lang]: title },
      excerpt: { [lang]: $("f_excerpt").value.trim() },
      year: $("f_year").value.trim(),
      region: $("f_region") ? $("f_region").value : "vietnam",
      date: $("f_date").value || new Date().toISOString().slice(0, 10),
      tags: $("f_tags").value.split(",").map((t) => t.trim()).filter(Boolean),
      cover: $("f_cover").value.trim(),
      lang,
      file: `posts/${slug}.md`,
    };

    const btn = $("publishBtn");
    btn.disabled = true;
    setStatus(window.I18N.t("admin.publishing"), "");
    try {
      // 1) ghi file markdown
      const mdPath = `posts/${slug}.md`;
      const existingMd = await getFile(mdPath);
      await putFile(mdPath, content + "\n", `${existingMd ? "Cập nhật" : "Thêm"} bài: ${title}`, existingMd && existingMd.sha);

      // 2) cập nhật index.json
      const idxFile = await getFile("posts/index.json");
      let index = { posts: [] };
      if (idxFile) { try { index = JSON.parse(b64decode(idxFile.content)); } catch (e) {} }
      if (!Array.isArray(index.posts)) index.posts = [];
      const i = index.posts.findIndex((p) => p.slug === slug);
      if (i >= 0) {
        // GIỮ LẠI mọi trường cũ (lat/lng/place/credit/verified/featured…) rồi ghi đè bằng dữ liệu form
        const prev = index.posts[i];
        const merged = { ...prev, ...post };
        merged.title = { ...(typeof prev.title === "object" ? prev.title : {}), ...post.title };
        merged.excerpt = { ...(typeof prev.excerpt === "object" ? prev.excerpt : {}), ...post.excerpt };
        index.posts[i] = merged;
      } else {
        index.posts.push(post);
      }
      index.posts.sort((a, b) => (a.date < b.date ? 1 : -1));
      await putFile("posts/index.json", JSON.stringify(index, null, 2) + "\n", `Cập nhật mục lục: ${title}`, idxFile && idxFile.sha);

      setStatus(window.I18N.t("admin.success"), "ok");
      Store._reset();
      loadPostList();
      $("f_slug").dataset.locked = "1";
      $("deleteBtn").style.display = "inline-flex";
    } catch (e) {
      setStatus(window.I18N.t("admin.error") + " " + e.message, "err");
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------- xóa ---------- */
  async function removePost() {
    const slug = $("f_slug").value.trim();
    if (!slug || !token()) return;
    if (!confirm(window.I18N.t("admin.confirmdelete"))) return;
    setStatus("…");
    try {
      const mdPath = `posts/${slug}.md`;
      const md = await getFile(mdPath);
      if (md) await deleteFile(mdPath, `Xóa bài: ${slug}`, md.sha);
      const idxFile = await getFile("posts/index.json");
      if (idxFile) {
        let index = JSON.parse(b64decode(idxFile.content));
        index.posts = (index.posts || []).filter((p) => p.slug !== slug);
        await putFile("posts/index.json", JSON.stringify(index, null, 2) + "\n", `Gỡ khỏi mục lục: ${slug}`, idxFile.sha);
      }
      setStatus(window.I18N.t("admin.deleted"), "ok");
      Store._reset();
      resetForm();
      loadPostList();
    } catch (e) {
      setStatus(window.I18N.t("admin.error") + " " + e.message, "err");
    }
  }

  /* ---------- preview (đổi ảnh vừa tải lên → xem trước ngay) ---------- */
  const localImages = {}; // { "assets/uploads/x.png": "data:..." } cho phiên hiện tại
  function preview() {
    let html = window.mdToHtml($("f_content").value);
    Object.keys(localImages).forEach((path) => {
      html = html.split(`src="${path}"`).join(`src="${localImages[path]}"`);
    });
    $("previewBox").innerHTML = `<div class="prose">${html}</div>`;
  }

  /* ---------- Tải ảnh lên repo (local file / dán clipboard) ---------- */
  const readAs = (file, how) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej;
    how === "buf" ? r.readAsArrayBuffer(file) : r.readAsDataURL(file);
  });
  function b64FromBuffer(buf) {
    const bytes = new Uint8Array(buf); let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  async function uploadImage(file) {
    if (!token()) { setStatus(window.I18N.t("admin.needtoken"), "err"); throw new Error("no token"); }
    if (!/^image\//.test(file.type)) throw new Error("not an image");
    const ext = (file.name.split(".").pop() || file.type.split("/")[1] || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
    const base = (($("f_slug").value.trim() || "img")).slice(0, 30);
    const path = `assets/uploads/${Date.now()}-${base}.${ext}`;
    setStatus(window.I18N.t("admin.uploading"), "");
    const [dataURL, buf] = await Promise.all([readAs(file, "data"), readAs(file, "buf")]);
    await putRaw(path, b64FromBuffer(buf), `Thêm ảnh: ${path}`, null);
    localImages[path] = dataURL;
    setStatus(window.I18N.t("admin.uploaded"), "ok");
    return path;
  }
  function initImageUpload() {
    const fileInput = $("imgFileInput");
    const coverInput = $("coverFileInput");
    if (fileInput) fileInput.addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const p = await uploadImage(f); insertBlock(`![](${p})\n`); preview(); }
      catch (err) { if (err.message !== "no token") setStatus(window.I18N.t("admin.error") + " " + err.message, "err"); }
      finally { e.target.value = ""; }
    });
    if (coverInput) coverInput.addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      try { const p = await uploadImage(f); $("f_cover").value = p; }
      catch (err) { if (err.message !== "no token") setStatus(window.I18N.t("admin.error") + " " + err.message, "err"); }
      finally { e.target.value = ""; }
    });
    // Dán ảnh trực tiếp vào ô nội dung
    const ta = $("f_content");
    if (ta) ta.addEventListener("paste", async (e) => {
      const item = [...(e.clipboardData.items || [])].find((it) => it.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      try { const p = await uploadImage(item.getAsFile()); insertBlock(`![](${p})\n`); }
      catch (err) { if (err.message !== "no token") setStatus(window.I18N.t("admin.error") + " " + err.message, "err"); }
    });
  }

  /* ---------- Nhập bài từ .md / .docx ---------- */
  let mammothLoading = null;
  function loadMammoth() {
    if (window.mammoth) return Promise.resolve(window.mammoth);
    if (mammothLoading) return mammothLoading;
    mammothLoading = new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
      s.onload = () => res(window.mammoth); s.onerror = () => rej(new Error("Không tải được bộ chuyển .docx"));
      document.head.appendChild(s);
    });
    return mammothLoading;
  }
  // HTML → Markdown gọn nhẹ (đủ cho nội dung docx thông thường)
  function htmlToMd(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let imgCount = 0;
    const walk = (node) => {
      let out = "";
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) { out += n.textContent.replace(/\s+/g, " "); return; }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        const inner = walk(n).trim();
        if (/^h[1-6]$/.test(tag)) out += `\n\n${"#".repeat(+tag[1])} ${inner}\n\n`;
        else if (tag === "p") out += `\n\n${inner}\n\n`;
        else if (tag === "br") out += "\n";
        else if (tag === "strong" || tag === "b") out += `**${inner}**`;
        else if (tag === "em" || tag === "i") out += `*${inner}*`;
        else if (tag === "a") out += `[${inner}](${n.getAttribute("href") || ""})`;
        else if (tag === "blockquote") out += `\n\n> ${inner}\n\n`;
        else if (tag === "li") out += `- ${inner}\n`;
        else if (tag === "ul" || tag === "ol") out += `\n${inner}\n`;
        else if (tag === "img") { imgCount++; /* bỏ ảnh nhúng, người dùng tải lại bằng nút Ảnh */ }
        else out += inner;
      });
      return out;
    };
    let md = walk(doc.body).replace(/\n{3,}/g, "\n\n").trim();
    return { md, imgCount };
  }
  function initImport() {
    const mdInput = $("mdFileInput");
    const docxInput = $("docxFileInput");
    if (mdInput) mdInput.addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const text = await f.text();
      $("f_content").value = text;
      if (!$("f_title").value && !$("f_slug").dataset.locked) {
        const h1 = text.match(/^#\s+(.+)$/m); if (h1) { $("f_title").value = h1[1]; $("f_slug").value = slugify(h1[1]); }
      }
      setStatus(window.I18N.t("admin.imported"), "ok"); preview(); e.target.value = "";
    });
    if (docxInput) docxInput.addEventListener("change", async (e) => {
      const f = e.target.files[0]; if (!f) return;
      setStatus(window.I18N.t("admin.converting"), "");
      try {
        const mammoth = await loadMammoth();
        const buf = await readAs(f, "buf");
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
        const { md, imgCount } = htmlToMd(html);
        $("f_content").value = md;
        // tự lấy tiêu đề từ dòng H1 đầu tiên
        const h1 = md.match(/^#\s+(.+)$/m);
        if (h1 && !$("f_title").value) { $("f_title").value = h1[1]; if (!$("f_slug").dataset.locked) $("f_slug").value = slugify(h1[1]); }
        setStatus(window.I18N.t("admin.imported") + (imgCount ? ` (${imgCount} ảnh bị bỏ qua — hãy chèn lại bằng nút Ảnh)` : ""), "ok");
        preview();
      } catch (err) {
        setStatus(window.I18N.t("admin.error") + " " + err.message, "err");
      } finally { e.target.value = ""; }
    });
  }

  /* ---------- thanh công cụ Markdown ---------- */
  function wrapSelection(before, after, placeholder) {
    const ta = $("f_content");
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.slice(s, e) || placeholder || "";
    ta.value = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
    ta.focus();
    ta.selectionStart = s + before.length;
    ta.selectionEnd = s + before.length + sel.length;
  }
  function prefixLine(prefix) {
    const ta = $("f_content");
    const s = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf("\n", s - 1) + 1;
    ta.value = ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart);
    ta.focus(); ta.selectionStart = ta.selectionEnd = s + prefix.length;
  }
  function insertBlock(text) {
    const ta = $("f_content");
    const s = ta.selectionStart;
    const nl = (ta.value.slice(0, s).endsWith("\n") || s === 0) ? "" : "\n";
    ta.value = ta.value.slice(0, s) + nl + text + ta.value.slice(s);
    ta.focus(); ta.selectionStart = ta.selectionEnd = s + nl.length + text.length;
  }
  function initToolbar() {
    const bar = $("mdToolbar");
    if (!bar) return;
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-md]");
      if (!b) return;
      const vi = window.I18N.lang !== "en";
      switch (b.dataset.md) {
        case "h2": prefixLine("## "); break;
        case "h3": prefixLine("### "); break;
        case "bold": wrapSelection("**", "**", vi ? "chữ đậm" : "bold text"); break;
        case "italic": wrapSelection("*", "*", vi ? "chữ nghiêng" : "italic text"); break;
        case "quote": prefixLine("> "); break;
        case "ul": prefixLine("- "); break;
        case "link": wrapSelection("[", "](https://)", vi ? "nội dung" : "text"); break;
        case "img": insertBlock(`![${vi ? "mô tả ảnh" : "alt"}](https://...)\n`); break;
        case "upload": $("imgFileInput").click(); break;
        case "hr": insertBlock("\n---\n"); break;
        case "ref": insertBlock(`\n## ${vi ? "Nguồn tham khảo" : "References"}\n\n1. \n`); break;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initToken();
    initToolbar();
    initImageUpload();
    initImport();
    resetForm();
    if (token()) connect();

    // Mở sẵn bài để sửa khi vào từ nút "Sửa bài viết" (admin.html?slug=…)
    const editSlug = new URLSearchParams(location.search).get("slug");
    if (editSlug) {
      loadPost(editSlug);
      const trySelect = () => { const sel = $("loadSelect"); if (sel && [...sel.options].some((o) => o.value === editSlug)) sel.value = editSlug; };
      setTimeout(trySelect, 400); setTimeout(trySelect, 1200);
    }

    // tự sinh slug từ tiêu đề khi chưa khóa
    $("f_title").addEventListener("input", () => {
      if (!$("f_slug").dataset.locked) $("f_slug").value = slugify($("f_title").value);
    });
    $("f_slug").addEventListener("input", () => ($("f_slug").dataset.locked = "1"));

    $("publishBtn").addEventListener("click", publish);
    $("previewBtn").addEventListener("click", preview);
    $("deleteBtn").addEventListener("click", removePost);
    $("newBtn").addEventListener("click", resetForm);
    if ($("loadSelect")) $("loadSelect").addEventListener("change", (e) => loadPost(e.target.value));

    // nút nhập tệp & tải ảnh bìa
    if ($("importDocxBtn")) $("importDocxBtn").addEventListener("click", () => $("docxFileInput").click());
    if ($("importMdBtn")) $("importMdBtn").addEventListener("click", () => $("mdFileInput").click());
    if ($("coverUploadBtn")) $("coverUploadBtn").addEventListener("click", () => $("coverFileInput").click());
  });
})();
