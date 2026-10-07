/* Static content is readable without JS. Language controls navigate to a variant. */
(function () {
  window.I18N.lang = document.documentElement.lang;
  window.addEventListener("langchange", (event) => {
    const alternate = document.querySelector(`link[rel="alternate"][hreflang="${event.detail.lang}"]`);
    if (!alternate) return;
    const name = new URL(alternate.href).pathname.split("/").pop();
    location.assign(new URL(name, location.href).href);
  });
  document.addEventListener("DOMContentLoaded", () => {
    const english = document.documentElement.lang === "en";
    const citation = document.getElementById("staticCitation");
    document.getElementById("staticCitationStyle")?.addEventListener("change", event => {
      citation.textContent = citation.dataset[event.target.value];
    });
    document.getElementById("staticCopyCitation")?.addEventListener("click", async event => {
      try { await navigator.clipboard.writeText(citation.textContent); event.target.textContent = english ? "Copied" : "Đã sao chép"; }
      catch (_) { event.target.textContent = english ? "Select and copy the citation" : "Hãy chọn và sao chép trích dẫn"; }
    });
    document.getElementById("staticShare")?.addEventListener("click", async event => {
      try {
        if (navigator.share) await navigator.share({ title: document.title, url: location.href });
        else { await navigator.clipboard.writeText(location.href); event.target.textContent = english ? "Link copied" : "Đã sao chép link"; }
      } catch (_) { /* Cancellation does not change the article. */ }
    });
    const progress = document.getElementById("staticProgress");
    const update = () => { const max = document.documentElement.scrollHeight - innerHeight; progress.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 100}%`; };
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update); update();
    (async () => {
      try {
        const posts = await window.Store.all();
        const response = await fetch("figures/index.json");
        const figures = response.ok ? (await response.json()).figures || [] : [];
        const entries = [...posts.map(p => ({ title: window.Store.localized(p.title, window.I18N.lang), url: window.hwArticleUrl("post", p.slug) })), ...figures.map(f => ({ title: window.Store.localized(f.name, window.I18N.lang), url: window.hwArticleUrl("figure", f.slug) }))];
        window.hwAutoLink(document.querySelector(".prose"), entries.filter(entry => new URL(entry.url, document.baseURI).pathname !== location.pathname));
      } catch (_) { /* No-JS/static content remains complete when data is offline. */ }
    })();
  });
})();
