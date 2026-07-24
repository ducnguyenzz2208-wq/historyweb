/*
 * admin.js — trang quản trị: viết/sửa/xóa bài và commit thẳng lên repo qua GitHub API.
 * Token chỉ lưu trong localStorage của trình duyệt, không gửi đi đâu khác ngoài api.github.com.
 *
 * Tối ưu v2:
 * - Song song hoá API calls (getFile song song) → giảm ~50% thời gian đăng bài.
 * - Optimistic cache: bài mới hiển thị ngay trên blog/trang chủ mà không chờ deploy.
 * - Ảnh hiển thị preview ngay khi dán/tải lên.
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

  /**
   * Ghi NHIỀU tệp trong MỘT commit duy nhất (Git Data API).
   * Vì sao: mỗi commit đẩy lên GitHub kích hoạt một lượt deploy. Trước đây một
   * lần đăng bài tạo 3 commit (ảnh → .md → index.json) ⇒ 3 lượt deploy, dễ chạm
   * giới hạn của Vercel và khiến ảnh/bài "lệch nhau" nếu một commit lỗi.
   * files: [{ path, content, encoding: "utf-8" | "base64" }]
   */
  async function commitFiles(files, message) {
    if (!files.length) return null;
    const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
    const baseSha = ref.object.sha;
    const baseCommit = await gh(`/repos/${REPO}/git/commits/${baseSha}`);

    // Tạo blob cho từng tệp (song song)
    const blobs = await Promise.all(files.map((f) =>
      gh(`/repos/${REPO}/git/blobs`, {
        method: "POST",
        body: JSON.stringify({ content: f.content, encoding: f.encoding || "utf-8" }),
      })
    ));

    const tree = await gh(`/repos/${REPO}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseCommit.tree.sha,
        tree: files.map((f, i) => ({ path: f.path, mode: "100644", type: "blob", sha: blobs[i].sha })),
      }),
    });

    const commit = await gh(`/repos/${REPO}/git/commits`, {
      method: "POST",
      body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
    });

    await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha }),
    });
    return commit.sha;
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

  /* ---------- Nội dung song ngữ: soạn VI và EN trong cùng một biểu mẫu ----------
     Lưu thành hai tệp Markdown riêng (slug.vi.md / slug.en.md) — giữ được
     Markdown thuần, dễ sửa trên GitHub, không phải escape như nhét vào JSON. */
  const LANGS = ["vi", "en"];
  const draft = { vi: "", en: "" };
  let curLang = "vi";

  /** Ghi nội dung đang gõ vào bản nháp của ngôn ngữ hiện tại. */
  function flushDraft() { draft[curLang] = $("f_content").value; }

  function markLangTabs() {
    document.querySelectorAll("#langTabs button").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === curLang);
      b.classList.toggle("has-content", !!(draft[b.dataset.lang] || "").trim());
    });
  }

  function setLang(lang) {
    if (!LANGS.includes(lang) || lang === curLang) return;
    flushDraft();
    curLang = lang;
    $("f_content").value = draft[curLang] || "";
    markLangTabs();
    preview();
  }

  function initLangTabs() {
    const tabs = $("langTabs");
    if (!tabs) return;
    tabs.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-lang]");
      if (b) setLang(b.dataset.lang);
    });
    $("f_content").addEventListener("input", () => { draft[curLang] = $("f_content").value; markLangTabs(); });
  }

  /* ---------- Loại nội dung: sự kiện (posts) / nhân vật (figures) ---------- */
  let TYPE = "event";
  const META = {
    event: { index: "posts/index.json", key: "posts", dir: "posts", label: "sự kiện" },
    figure: { index: "figures/index.json", key: "figures", dir: "figures", label: "nhân vật" },
  };
  const isFig = () => TYPE === "figure";

  function applyType() {
    document.querySelectorAll("[data-only]").forEach((el) => {
      el.style.display = el.getAttribute("data-only") === TYPE ? "" : "none";
    });
    document.querySelectorAll("#typeToggle button").forEach((b) => b.classList.toggle("active", b.dataset.type === TYPE));
    const lblTitle = $("lbl_title");
    if (lblTitle) lblTitle.textContent = window.I18N.t(isFig() ? "admin.f.name" : "admin.f.title");
    $("f_title").placeholder = isFig() ? (window.I18N.lang === "en" ? "Figure name" : "Tên nhân vật") : "";
    if (isFig()) initMapPicker(); // không cần, nhưng vô hại
  }
  function setType(t, keepForm) {
    TYPE = t === "figure" ? "figure" : "event";
    if (!keepForm) resetForm(true);
    applyType();
    if (!isFig()) initMapPicker();
  }

  /* ---------- Bộ chọn vị trí trên bản đồ ---------- */
  async function initMapPicker() {
    const host = $("mapPicker");
    if (!host || host.dataset.built) { return; }
    host.dataset.built = "1";
    let world = { features: [] };
    try { const r = await fetch("assets/data/world.geo.json"); if (r.ok) world = await r.json(); } catch (e) {}
    const ring = (r) => { let d = "", pl = null; for (const c of r) { const x = (c[0] + 180).toFixed(2), y = (90 - c[1]).toFixed(2); if (pl !== null && Math.abs(c[0] - pl) > 180) d += `M${x} ${y}`; else d += (d === "" ? "M" : "L") + x + " " + y; pl = c[0]; } return d + "Z"; };
    const fpath = (f) => (f.t === "MultiPolygon" ? f.c : [f.c]).map((poly) => poly.map(ring).join("")).join("");
    const lands = (world.features || []).map((f) => `<path class="atlas-land" d="${fpath(f)}"/>`).join("");
    host.innerHTML = `<svg id="pickerSvg" viewBox="0 0 360 180" class="atlas-map__svg" preserveAspectRatio="xMidYMid meet">
      <rect width="360" height="180" class="atlas-sea"/><g class="atlas-lands">${lands}</g>
      <circle id="pickerPin" r="3.2" class="atlas-pin__dot" style="display:none"></circle></svg>`;
    const svg = $("pickerSvg"), pin = $("pickerPin");
    const setPin = (lng, lat) => { pin.setAttribute("cx", lng + 180); pin.setAttribute("cy", 90 - lat); pin.style.display = ""; };
    svg.addEventListener("click", (e) => {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      const lng = +(p.x - 180).toFixed(4), lat = +(90 - p.y).toFixed(4);
      if (lat > 85 || lat < -85 || lng > 180 || lng < -180) return;
      $("f_lat").value = lat; $("f_lng").value = lng; setPin(lng, lat);
    });
    const sync = () => { const lat = parseFloat($("f_lat").value), lng = parseFloat($("f_lng").value); if (!isNaN(lat) && !isNaN(lng)) setPin(lng, lat); else pin.style.display = "none"; };
    $("f_lat").addEventListener("input", sync);
    $("f_lng").addEventListener("input", sync);
    window._pickerSync = sync;
  }

  /* ---------- danh sách để sửa (gồm cả sự kiện & nhân vật) ---------- */
  async function loadPostList() {
    const sel = $("loadSelect");
    if (!sel) return;
    let opts = `<option value="">— ${window.I18N.t("admin.new")} —</option>`;
    try {
      const posts = await Store.all();
      if (posts.length) opts += `<optgroup label="${window.I18N.t("admin.type.event")}">` +
        posts.map((p) => `<option value="event:${p.slug}">${(p.year ? p.year + " · " : "")}${Store.localized(p.title, window.I18N.lang)}</option>`).join("") + `</optgroup>`;
    } catch (e) {}
    try {
      const figs = await (window.loadFigures ? window.loadFigures() : Promise.resolve([]));
      if (figs.length) opts += `<optgroup label="${window.I18N.t("admin.type.figure")}">` +
        figs.map((f) => `<option value="figure:${f.slug}">${(f.born ? f.born + " · " : "")}${Store.localized(f.name, window.I18N.lang)}</option>`).join("") + `</optgroup>`;
    } catch (e) {}
    sel.innerHTML = opts;
  }

  async function loadPost(value) {
    if (!value) { resetForm(true); return; }
    let type = "event", slug = value;
    if (value.indexOf(":") >= 0) { const parts = value.split(":"); type = parts[0]; slug = parts.slice(1).join(":"); }
    setType(type, true);
    setStatus("…");
    try {
      const lang = window.I18N.lang;
      let item = null;
      if (isFig()) {
        const figures = await (window.loadFigures ? window.loadFigures() : Promise.resolve([]));
        item = figures.find((x) => x.slug === slug);
      } else {
        item = await Store.bySlug(slug);
      }
      
      if (!item) { setStatus("?", "err"); return; }
      $("f_slug").value = item.slug; $("f_slug").dataset.locked = "1";
      $("f_region").value = item.region || "vietnam";
      $("f_tags").value = (item.tags || []).join(", ");
      $("f_excerpt").value = Store.localized(item.excerpt, lang);
      $("f_era").value = typeof item.era === "object" ? Store.localized(item.era, lang) : (item.era || "");
      $("f_lang").value = item.lang || lang;
      if (isFig()) {
        $("f_title").value = Store.localized(item.name, lang);
        $("f_born").value = item.born || ""; $("f_died").value = item.died || "";
        $("f_role").value = Store.localized(item.role, lang);
        $("f_fieldv").value = Store.localized(item.field, lang);
        $("f_cover").value = item.portrait || "";
      } else {
        $("f_title").value = Store.localized(item.title, lang);
        $("f_date").value = item.date || ""; $("f_year").value = item.year || "";
        $("f_cover").value = item.cover || "";
        $("f_lat").value = item.lat != null ? item.lat : "";
        $("f_lng").value = item.lng != null ? item.lng : "";
        $("f_place").value = typeof item.place === "object" ? Store.localized(item.place, lang) : (item.place || "");
        if (window._pickerSync) window._pickerSync();
      }
      
      if (isFig()) {
        const localMap = (() => { try { return JSON.parse(localStorage.getItem("hw_pending_fig_content") || "{}"); } catch (e) { return {}; } })();
        if (localMap[slug]) { draft.vi = localMap[slug]; draft.en = ""; curLang = "vi"; $("f_content").value = draft.vi; markLangTabs(); }
        else await loadDrafts(item);
      } else {
        await loadDrafts(item);
      }
      
      setStatus("", "");
      $("deleteBtn").style.display = "inline-flex";
    } catch (e) {
      setStatus(window.I18N.t("admin.error") + " " + e.message, "err");
    }
  }

  /** Tải nội dung của cả hai ngôn ngữ vào bản nháp. */
  async function loadDrafts(item) {
    const get = async (path) => {
      if (!path) return "";
      try { const r = await fetch(path + "?_=" + Date.now()); return r.ok ? await r.text() : ""; }
      catch (e) { return ""; }
    };
    const files = item.files && typeof item.files === "object" ? item.files : null;
    if (files) {
      const [vi, en] = await Promise.all([get(files.vi), get(files.en)]);
      draft.vi = vi; draft.en = en;
    } else {
      draft.vi = await get(item.file); draft.en = "";
    }
    curLang = draft.vi.trim() || !draft.en.trim() ? "vi" : "en";
    $("f_content").value = draft[curLang] || "";
    markLangTabs();
  }

  function resetForm(keepType) {
    ["f_title", "f_slug", "f_year", "f_born", "f_died", "f_role", "f_fieldv", "f_era", "f_tags", "f_cover", "f_excerpt", "f_content", "f_lat", "f_lng", "f_place"].forEach((id) => { if ($(id)) $(id).value = ""; });
    draft.vi = ""; draft.en = ""; curLang = "vi"; markLangTabs();
    $("f_date").value = new Date().toISOString().slice(0, 10);
    $("f_region").value = "vietnam";
    $("f_slug").dataset.locked = "";
    $("deleteBtn").style.display = "none";
    $("previewBox").innerHTML = "";
    if ($("loadSelect")) $("loadSelect").value = "";
    const pin = $("pickerPin"); if (pin) pin.style.display = "none";
    if (!keepType) applyType();
  }

  /* ---------- xuất bản (TỐI ƯU: song song hoá + optimistic UI) ---------- */
  async function publish() {
    if (!token()) { setStatus(window.I18N.t("admin.needtoken"), "err"); return; }
    const title = $("f_title").value.trim();
    flushDraft();
    const content = (draft[curLang] || "").trim();
    if (!title || !content) { setStatus(window.I18N.t("admin.needfields"), "err"); return; }
    const slug = $("f_slug").value.trim() || slugify(title);
    const lang = $("f_lang").value || "vi";
    const meta = META[TYPE];
    // Ngôn ngữ nào có nội dung thì ghi tệp riêng cho ngôn ngữ đó
    const filled = LANGS.filter((l) => (draft[l] || "").trim());
    const mdFiles = {};
    filled.forEach((l) => (mdFiles[l] = `${meta.dir}/${slug}.${l}.md`));
    const primary = filled.includes("vi") ? "vi" : filled[0] || "vi";
    const mdPath = mdFiles[primary] || `${meta.dir}/${slug}.md`;

    let item;
    if (isFig()) {
      item = {
        slug, name: { [lang]: title }, region: $("f_region").value,
        born: $("f_born").value.trim(), died: $("f_died").value.trim(),
        role: { [lang]: $("f_role").value.trim() }, field: { [lang]: $("f_fieldv").value.trim() },
        era: { [lang]: $("f_era").value.trim() }, portrait: $("f_cover").value.trim(),
        excerpt: { [lang]: $("f_excerpt").value.trim() },
        tags: $("f_tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        lang, file: mdPath, files: mdFiles,
      };
    } else {
      item = {
        slug, title: { [lang]: title }, excerpt: { [lang]: $("f_excerpt").value.trim() },
        year: $("f_year").value.trim(), region: $("f_region").value,
        era: { [lang]: $("f_era").value.trim() },
        date: $("f_date").value || new Date().toISOString().slice(0, 10),
        tags: $("f_tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        cover: $("f_cover").value.trim(), lang, file: mdPath, files: mdFiles,
      };
      const lat = parseFloat($("f_lat").value), lng = parseFloat($("f_lng").value);
      if (!isNaN(lat) && !isNaN(lng)) { item.lat = lat; item.lng = lng; }
      const place = $("f_place").value.trim(); if (place) item.place = { [lang]: place };
    }

    const btn = $("publishBtn"); btn.disabled = true;
    setStatus(window.I18N.t("admin.publishing"), "");
    try {
      const [existingMd, idxFile] = await Promise.all([getFile(mdPath), getFile(meta.index)]);

      /* Dựng index.json mới */
      let index = {}; index[meta.key] = [];
      if (idxFile) { try { index = JSON.parse(b64decode(idxFile.content)); } catch (e) {} }
      if (!Array.isArray(index[meta.key])) index[meta.key] = [];
      const list = index[meta.key];
      const i = list.findIndex((x) => x.slug === slug);
      const mergeBilingual = (prev) => {
        const merged = { ...prev, ...item };
        ["title", "name", "excerpt", "role", "field", "era", "place"].forEach((k) => {
          if (item[k] && typeof item[k] === "object") merged[k] = { ...(typeof prev[k] === "object" ? prev[k] : {}), ...item[k] };
        });
        return merged;
      };
      const mergedItem = i >= 0 ? mergeBilingual(list[i]) : item;
      if (i >= 0) list[i] = mergedItem; else list.push(item);
      if (!isFig()) list.sort((a, b) => (a.date < b.date ? 1 : -1));

      /* MỘT commit duy nhất: ảnh đang chờ + .md + index.json.
         Ảnh và bài luôn lên cùng lúc ⇒ không còn ảnh 404, và chỉ tốn 1 lượt deploy. */
      const usedImages = Object.keys(stagedImages)
        .filter((p) => content.includes(p) || $("f_cover").value.trim() === p);
      const files = [
        ...usedImages.map((p) => ({ path: p, content: stagedImages[p].base64, encoding: "base64" })),
        ...filled.map((l) => ({ path: mdFiles[l], content: (draft[l] || "").trim() + "\n", encoding: "utf-8" })),
        { path: meta.index, content: JSON.stringify(index, null, 2) + "\n", encoding: "utf-8" },
      ];
      const verb = existingMd ? "Cập nhật" : "Thêm";
      const imgNote = usedImages.length ? ` (+${usedImages.length} ảnh)` : "";
      await commitFiles(files, `${verb} ${meta.label}: ${title}${imgNote}`);
      usedImages.forEach((p) => delete stagedImages[p]); // đã lên repo

      /* ★ TỐI ƯU 2: Optimistic cache — bài hiện ngay không cần chờ deploy */
      const finalItem = i >= 0 ? mergedItem : item;
      if (isFig()) {
        if (window._addLocalFigure) window._addLocalFigure(finalItem);
        if (window._addLocalFigContent) window._addLocalFigContent(slug, content);
        if (window._resetFigures) window._resetFigures();
      } else {
        if (Store._addLocal) Store._addLocal(finalItem);
        if (Store._addLocalContent) Store._addLocalContent(slug, content);
      }
      Store._reset();

      setStatus(window.I18N.t("admin.success"), "ok");
      loadPostList();
      $("f_slug").dataset.locked = "1"; $("deleteBtn").style.display = "inline-flex";
    } catch (e) {
      setStatus(window.I18N.t("admin.error") + " " + e.message, "err");
    } finally { btn.disabled = false; }
  }

  /* ---------- xóa ---------- */
  async function removePost() {
    const slug = $("f_slug").value.trim();
    if (!slug || !token()) return;
    if (!confirm(window.I18N.t("admin.confirmdelete"))) return;
    setStatus("…");
    const meta = META[TYPE];
    try {
      for (const path of [`${meta.dir}/${slug}.md`, `${meta.dir}/${slug}.vi.md`, `${meta.dir}/${slug}.en.md`]) {
        const md = await getFile(path);
        if (md) await deleteFile(path, `Xóa ${meta.label}: ${slug}`, md.sha);
      }
      const idxFile = await getFile(meta.index);
      if (idxFile) {
        let index = JSON.parse(b64decode(idxFile.content));
        index[meta.key] = (index[meta.key] || []).filter((x) => x.slug !== slug);
        await putFile(meta.index, JSON.stringify(index, null, 2) + "\n", `Gỡ khỏi mục lục ${meta.label}: ${slug}`, idxFile.sha);
      }

      /* Optimistic: xóa khỏi cache local ngay */
      if (isFig()) {
        if (window._removeLocalFigure) window._removeLocalFigure(slug);
        if (window._resetFigures) window._resetFigures();
      } else {
        if (Store._removeLocal) Store._removeLocal(slug);
      }
      Store._reset();

      setStatus(window.I18N.t("admin.deleted"), "ok");
      resetForm(); loadPostList();
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
  /* Định dạng ảnh chấp nhận. Nhận diện theo phần mở rộng HOẶC MIME
     (một số nguồn — ảnh dán từ clipboard, tệp tải từ web — không có MIME chuẩn). */
  const IMAGE_EXT = {
    jpg: "jpg", jpeg: "jpg", jpe: "jpg", jfif: "jpg", pjpeg: "jpg",
    png: "png", apng: "png", gif: "gif", webp: "webp", avif: "avif",
    bmp: "bmp", ico: "ico", svg: "svg", tif: "tif", tiff: "tif", heic: "heic", heif: "heif",
  };
  const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // giới hạn an toàn cho GitHub Contents API

  /** Suy ra phần mở rộng chuẩn hoá từ tên tệp / MIME; null nếu không phải ảnh. */
  function imageExtOf(file) {
    const byName = (file.name || "").split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "");
    if (IMAGE_EXT[byName]) return IMAGE_EXT[byName];
    const byMime = (file.type || "").toLowerCase().replace(/^image\//, "").replace(/[^a-z0-9]/g, "");
    if (IMAGE_EXT[byMime]) return IMAGE_EXT[byMime];
    if (/^image\//.test(file.type || "")) return "png"; // ảnh lạ nhưng vẫn là ảnh
    return null;
  }

  /* Ảnh đang chờ: hiển thị ngay bằng data URL, được commit CÙNG bài khi Xuất bản.
     { "assets/uploads/x.jpg": { base64, dataURL } } */
  const stagedImages = {};

  /**
   * Nhận một ảnh: kiểm tra định dạng, đọc nội dung, hiển thị ngay và xếp hàng
   * chờ commit cùng bài viết. Trả về đường dẫn để chèn vào nội dung / ảnh bìa.
   */
  async function stageImage(file) {
    const ext = imageExtOf(file);
    if (!ext) throw new Error(window.I18N.t("admin.badformat"));
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(window.I18N.t("admin.toobig"));

    const base = slugify($("f_slug").value.trim() || "img").slice(0, 30);
    const path = `assets/uploads/${Date.now()}-${base}.${ext}`;
    const [dataURL, buf] = await Promise.all([readAs(file, "data"), readAs(file, "buf")]);

    stagedImages[path] = { base64: b64FromBuffer(buf), dataURL };
    localImages[path] = dataURL; // xem trước tức thì
    setStatus(window.I18N.t("admin.imgstaged"), "ok");
    return path;
  }

  /** Nhận ảnh rồi chèn vào nội dung (dùng chung cho chọn tệp / dán / kéo-thả). */
  async function acceptImage(file, target) {
    try {
      const path = await stageImage(file);
      if (target === "cover") $("f_cover").value = path;
      else { insertBlock(`![](${path})\n`); preview(); }
    } catch (err) {
      setStatus(window.I18N.t("admin.error") + " " + err.message, "err");
    }
  }

  /** Lấy tệp ảnh đầu tiên từ clipboard hoặc thao tác kéo-thả. */
  function imageFrom(dataTransfer) {
    if (!dataTransfer) return null;
    const files = [...(dataTransfer.files || [])];
    const byFile = files.find((f) => imageExtOf(f));
    if (byFile) return byFile;
    const item = [...(dataTransfer.items || [])].find((it) => it.kind === "file" && /^image\//.test(it.type));
    return item ? item.getAsFile() : null;
  }

  function initImageUpload() {
    const fileInput = $("imgFileInput");
    const coverInput = $("coverFileInput");
    if (fileInput) fileInput.addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (f) await acceptImage(f, "content");
      e.target.value = "";
    });
    if (coverInput) coverInput.addEventListener("change", async (e) => {
      const f = e.target.files[0];
      if (f) await acceptImage(f, "cover");
      e.target.value = "";
    });

    /* Dán ảnh (Ctrl+V) ở bất kỳ đâu trong trang quản trị:
       đang ở ô Ảnh bìa → đặt làm ảnh bìa; còn lại → chèn vào nội dung. */
    document.addEventListener("paste", async (e) => {
      const file = imageFrom(e.clipboardData);
      if (!file) return;
      e.preventDefault();
      await acceptImage(file, document.activeElement === $("f_cover") ? "cover" : "content");
    });

    /* Kéo-thả ảnh vào ô nội dung hoặc ô ảnh bìa */
    [["f_content", "content"], ["f_cover", "cover"]].forEach(([id, target]) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("drop-active"); });
      el.addEventListener("dragleave", () => el.classList.remove("drop-active"));
      el.addEventListener("drop", async (e) => {
        e.preventDefault(); el.classList.remove("drop-active");
        const file = imageFrom(e.dataTransfer);
        if (file) await acceptImage(file, target);
      });
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

  function initTypeToggle() {
    const tg = $("typeToggle");
    if (!tg) return;
    tg.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-type]");
      if (!b || b.dataset.type === TYPE) return;
      setType(b.dataset.type);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initToken();
    initToolbar();
    initImageUpload();
    initImport();
    initTypeToggle();
    initLangTabs();
    initMapPicker();
    resetForm();
    applyType();
    if (token()) connect();
    // cập nhật lại nhãn động khi đổi ngôn ngữ
    window.addEventListener("langchange", () => { applyType(); loadPostList(); });

    // Mở sẵn để sửa khi vào từ nút "Sửa" (admin.html?slug=… hoặc ?type=figure&slug=…)
    const params = new URLSearchParams(location.search);
    const editSlug = params.get("slug");
    if (editSlug) {
      const editType = params.get("type") === "figure" ? "figure" : "event";
      const val = `${editType}:${editSlug}`;
      loadPost(val);
      const trySelect = () => { const sel = $("loadSelect"); if (sel && [...sel.options].some((o) => o.value === val)) sel.value = val; };
      setTimeout(trySelect, 500); setTimeout(trySelect, 1400);
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
