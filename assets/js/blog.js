/*
 * blog.js — trang danh sách: tìm kiếm, lọc theo thẻ, render lưới bài viết.
 */
(function () {
  "use strict";
  const params = new URLSearchParams(location.search);
  let query = "";
  let activeTags = new Set();
  if (params.get("tag")) activeTags.add(params.get("tag"));
  let activeRegion = params.get("region") || "__all__";
  let activeCentury = params.get("century") || "__all__";
  const REGIONS = ["__all__", "vietnam", "world"];

  // Năm lịch sử (số nguyên) — dùng để sắp xếp theo dòng thời gian.
  const historicalYear = (x) =>
    parseInt(x && (x.historical_year != null ? x.historical_year : (x.year != null ? x.year : x.born)), 10) || 0;

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
      
      const btnHtml = `<button class="btn btn--ghost dropdown-btn" id="catFilterBtn" type="button">
        <span id="catFilterLabel">${window.I18N.t("blog.category") || "Danh mục"}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>`;
      
      const menuHtml = `<div class="dropdown-menu glass" id="catFilterMenu" style="display: none;">
        ${tags.map(t => `
          <label>
            <input type="checkbox" value="${t}" ${activeTags.has(t) ? 'checked' : ''}>
            ${t}
          </label>
        `).join("")}
      </div>`;
      
      fbox.innerHTML = `<div class="category-dropdown">${btnHtml}${menuHtml}</div>`;
      fbox.dataset.built = "1";

      const btn = document.getElementById("catFilterBtn");
      const menu = document.getElementById("catFilterMenu");
      
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = menu.style.display === "flex";
        menu.style.display = isOpen ? "none" : "flex";
        btn.classList.toggle("open", !isOpen);
      });

      document.addEventListener("click", (e) => {
        if (!fbox.contains(e.target) && menu.style.display === "flex") {
          menu.style.display = "none";
          btn.classList.remove("open");
        }
      });

      menu.addEventListener("change", (e) => {
        if (e.target.type === "checkbox") {
          if (e.target.checked) {
            activeTags.add(e.target.value);
          } else {
            activeTags.delete(e.target.value);
          }
          draw(posts, lang);
        }
      });
    } else if (fbox) {
      // cập nhật nhãn khi đổi ngôn ngữ
      const label = document.getElementById("catFilterLabel");
      if (label) label.textContent = window.I18N.t("blog.category") || "Danh mục";
    }

    draw(posts, lang);
  }

  function draw(posts, lang) {
    const grid = document.getElementById("blogGrid");
    if (!grid) return;
    const q = query.trim().toLowerCase();
    const filtered = posts.filter((p) => {
      const okRegion = activeRegion === "__all__" || p.region === activeRegion;
      const okTag = activeTags.size === 0 || (p.tags || []).some(t => activeTags.has(t));
      const okCentury = activeCentury === "__all__" || String(centuryOf(p.year)) === activeCentury;
      const hay = (Store.localized(p.title, lang) + " " + Store.localized(p.excerpt, lang) + " " + (p.tags || []).join(" ")).toLowerCase();
      const okQ = !q || hay.includes(q);
      return okRegion && okTag && okCentury && okQ;
    });
    // TASK 2: sắp xếp theo dòng thời gian lịch sử (năm tăng dần) trước khi render.
    filtered.sort((a, b) => historicalYear(a) - historicalYear(b));
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
