/*
 * blog.js — trang danh sách: tìm kiếm, lọc theo thẻ, render lưới bài viết.
 */
(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  let query = "";
  let activeTag = params.get("tag") || "__all__";
  let activeRegion = params.get("region") || "__all__";
  let activeCentury = params.get("century") || "__all__";
  const REGIONS = ["__all__", "vietnam", "world"];

  // Thế kỷ từ năm (năm dương lịch, dữ liệu hiện tại đều sau CN)
  function centuryOf(year) {
    const y = parseInt(year, 10);
    if (!y) return null;
    return Math.ceil(y / 100);
  }
  function centuryLabel(c) {
    if (c === "__all__") return window.I18N.t("century.all");
    return window.I18N.t("century.label") + " " + c;
  }

  const fallbackCover = (year) => window.hwPlaceholder(year || "H", 800, 500);

  function cardHTML(p, lang) {
    const title = Store.localized(p.title, lang);
    const excerpt = Store.localized(p.excerpt, lang);
    const tags = (p.tags || []).slice(0, 3).map((t) => `<span class="tag">${t}</span>`).join("");
    return `
    <article class="card" data-reveal>
      <a href="post.html?slug=${encodeURIComponent(p.slug)}" class="card__media">
        ${p.year ? `<span class="card__year">${p.year}</span>` : ""}
        <img src="${p.cover || fallbackCover(p.year)}" alt="${title}" loading="lazy" data-fallback="${window.hwFallback(p.cover, fallbackCover(p.year))}">
      </a>
      <div class="card__body">
        <div class="card__tags">${tags}</div>
        <h3 class="card__title"><a href="post.html?slug=${encodeURIComponent(p.slug)}">${title}</a></h3>
        <p class="card__excerpt">${excerpt}</p>
        <div class="card__meta"><span>${window.fmtDate(p.date, lang)}</span></div>
      </div>
    </article>`;
  }

  function regionLabel(r) {
    return r === "__all__" ? window.I18N.t("region.all")
      : r === "vietnam" ? window.I18N.t("region.vietnam")
      : window.I18N.t("region.world");
  }

  async function render() {
    const lang = window.I18N.lang;
    const posts = await Store.all();

    // segmented control khu vực
    const seg = document.getElementById("regionSeg");
    if (seg) {
      seg.innerHTML = REGIONS.map((r) =>
        `<button role="tab" class="${r === activeRegion ? "active" : ""}" data-region="${r}">${regionLabel(r)}</button>`
      ).join("");
      if (!seg.dataset.wired) {
        seg.dataset.wired = "1";
        seg.addEventListener("click", (e) => {
          const b = e.target.closest("button[data-region]");
          if (!b) return;
          activeRegion = b.dataset.region;
          seg.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
          draw(posts, lang);
        });
      }
    }

    // bộ lọc thế kỷ
    const csel = document.getElementById("centurySelect");
    if (csel) {
      const centuries = [...new Set(posts.map((p) => centuryOf(p.year)).filter(Boolean))].sort((a, b) => a - b);
      csel.innerHTML = `<option value="__all__">${window.I18N.t("century.all")}</option>` +
        centuries.map((c) => `<option value="${c}" ${String(c) === activeCentury ? "selected" : ""}>${window.I18N.t("century.label")} ${c}</option>`).join("");
      csel.value = activeCentury;
      if (!csel.dataset.wired) {
        csel.dataset.wired = "1";
        csel.addEventListener("change", () => { activeCentury = csel.value; draw(posts, lang); });
      }
    }

    // filters
    const fbox = document.getElementById("filters");
    if (fbox && !fbox.dataset.built) {
      const tags = Store.allTags(posts);
      fbox.innerHTML =
        `<button class="chip ${activeTag === "__all__" ? "active" : ""}" data-tag="__all__">${window.I18N.t("blog.all")}</button>` +
        tags.map((t) => `<button class="chip ${activeTag === t ? "active" : ""}" data-tag="${t}">${t}</button>`).join("");
      fbox.dataset.built = "1";
      fbox.addEventListener("click", (e) => {
        const b = e.target.closest(".chip");
        if (!b) return;
        activeTag = b.dataset.tag;
        fbox.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
        draw(posts, lang);
      });
    } else if (fbox) {
      // cập nhật nhãn "Tất cả" khi đổi ngôn ngữ
      const allChip = fbox.querySelector('[data-tag="__all__"]');
      if (allChip) allChip.textContent = window.I18N.t("blog.all");
    }

    draw(posts, lang);
  }

  function draw(posts, lang) {
    const grid = document.getElementById("blogGrid");
    if (!grid) return;
    const q = query.trim().toLowerCase();
    const filtered = posts.filter((p) => {
      const okRegion = activeRegion === "__all__" || p.region === activeRegion;
      const okTag = activeTag === "__all__" || (p.tags || []).includes(activeTag);
      const okCentury = activeCentury === "__all__" || String(centuryOf(p.year)) === activeCentury;
      const hay = (Store.localized(p.title, lang) + " " + Store.localized(p.excerpt, lang) + " " + (p.tags || []).join(" ")).toLowerCase();
      const okQ = !q || hay.includes(q);
      return okRegion && okTag && okCentury && okQ;
    });
    grid.innerHTML = filtered.length
      ? filtered.map((p) => cardHTML(p, lang)).join("")
      : `<p class="empty-state">${window.I18N.t("blog.empty")}</p>`;
    if (window.hwReveal) window.hwReveal();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const search = document.getElementById("searchInput");
    if (search) search.addEventListener("input", (e) => { query = e.target.value; render(); });
    render();
  });
  window.addEventListener("langchange", render);
})();
