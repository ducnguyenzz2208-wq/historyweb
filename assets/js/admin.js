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
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }

  async function getFile(filePath) {
    try {
      return await gh(`/repos/${REPO}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}?ref=${BRANCH}`);
    } catch (e) {
      return null; // chưa tồn tại
    }
  }

  async function putFile(filePath, contentStr, message, sha) {
    const body = { message, content: b64encode(contentStr), branch: BRANCH };
    if (sha) body.sha = sha;
    return gh(`/repos/${REPO}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
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
        // gộp title/excerpt đa ngôn ngữ đã có
        const prev = index.posts[i];
        post.title = { ...(typeof prev.title === "object" ? prev.title : {}), ...post.title };
        post.excerpt = { ...(typeof prev.excerpt === "object" ? prev.excerpt : {}), ...post.excerpt };
        post.featured = prev.featured;
        index.posts[i] = post;
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

  /* ---------- preview ---------- */
  function preview() {
    $("previewBox").innerHTML = `<div class="prose">${window.mdToHtml($("f_content").value)}</div>`;
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
        case "hr": insertBlock("\n---\n"); break;
        case "ref": insertBlock(`\n## ${vi ? "Nguồn tham khảo" : "References"}\n\n1. \n`); break;
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initToken();
    initToolbar();
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
  });
})();
