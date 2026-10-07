/* Editorial evidence is separate from the presence of citations. */
(function () {
  let audit;
  window.hwSourceReview = async function (item, kind, lang) {
    try {
      if (!audit) audit = fetch("assets/data/source-audit.json").then(r => {
        if (!r.ok) throw new Error("Source audit unavailable"); return r.json();
      }).catch(error => { audit = null; throw error; });
      const data = await audit;
      if (window.I18N.lang !== lang) return;
      const article = document.querySelector("article.article");
      if (!article || article.querySelector(".source-review")) return;
      const entry = data.items.find(x => x.slug === item.slug && x.kind === kind);
      const section = document.createElement("section"); section.className = "source-review";
      const title = document.createElement("h2"); title.textContent = lang === "en" ? "Sources and editorial review" : "Nguồn và đối chiếu biên tập"; section.append(title);
      const note = document.createElement("p"); note.textContent = lang === "en" ? "Awaiting claim-level review. A reference list is not a verified badge." : "Chờ đối chiếu từng nhận định. Danh mục tài liệu tham khảo không phải nhãn đã kiểm chứng."; section.append(note);
      const list = document.createElement("ul");
      for (const source of entry?.sources || []) {
        const li = document.createElement("li"), url = window.hwMarkdownUrl(source.url || "");
        if (url) { const a = document.createElement("a"); a.href = url; a.textContent = source.label; a.rel = "noopener"; a.target = "_blank"; li.append(a); }
        else li.textContent = source.label;
        list.append(li);
      }
      section.append(list);
      const report = document.createElement("a"); report.href = "SOURCE_AUDIT.md"; report.textContent = lang === "en" ? "Image and source audit" : "Báo cáo nguồn và ảnh"; section.append(report);
      article.append(section);
    } catch (_) { /* Existing article and footnotes remain readable. */ }
  };
})();
