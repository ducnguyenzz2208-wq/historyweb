/*
 * Hệ thống đa ngôn ngữ (i18n) đơn giản.
 * - Dịch qua thuộc tính data-i18n / data-i18n-html / data-i18n-attr trên HTML
 * - Lưu lựa chọn ngôn ngữ vào localStorage
 * - Phát sự kiện "langchange" để các module khác (blog, post) render lại
 */
(function () {
  "use strict";

  const STRINGS = {
    vi: {
      "nav.home": "Trang chủ",
      "nav.blog": "Bài viết",
      "nav.figures": "Nhân vật",
      "nav.timeline": "Dòng thời gian",
      "nav.about": "Giới thiệu",
      "nav.profile": "Trang cá nhân",
      "nav.admin": "Quản trị",
      "nav.menu": "Menu",

      "search.open": "Tra cứu",
      "search.placeholder": "Tra cứu bài viết, nhân vật, nội dung…",
      "search.hint": "Nhấn Ctrl / ⌘ + K để tra cứu nhanh · Esc để đóng",
      "search.none": "Không tìm thấy kết quả phù hợp.",
      "search.recent": "Tra cứu gần đây",
      "search.suggested": "Gợi ý chủ đề",

      "nav.topics": "Chủ đề",
      "nav.atlas": "Bản đồ",
      "nav.gallery": "Tư liệu",

      "topics.kicker": "Tra cứu theo chủ đề",
      "topics.title": "Chủ đề",
      "topics.subtitle": "Mỗi chủ đề tập hợp mọi bài viết và nhân vật liên quan — một cửa vào để lần theo dòng chảy.",
      "topics.count": "mục",
      "topic.kicker": "Chủ đề",
      "topic.posts": "Bài viết",
      "topic.figures": "Nhân vật",
      "topic.empty": "Chưa có nội dung cho chủ đề này.",
      "topic.back": "Tất cả chủ đề",

      "atlas.kicker": "Không gian & Thời gian",
      "atlas.title": "Bản đồ & Niên biểu",
      "atlas.subtitle": "Lần theo lịch sử qua nơi chốn và thời gian — nhấp vào một điểm hoặc một mốc để mở bài viết.",
      "atlas.map": "Bản đồ sự kiện",
      "atlas.timeline": "Niên biểu tương tác",
      "atlas.nocoord": "Sự kiện chưa gắn toạ độ",
      "atlas.all": "Tất cả",

      "gallery.kicker": "Thư viện tư liệu",
      "gallery.title": "Tư liệu & Hình ảnh",
      "gallery.subtitle": "Bộ sưu tập hình ảnh dùng trên trang, kèm nguồn gốc và ghi công.",
      "gallery.source": "Nguồn",
      "gallery.view": "Mở bài",

      "century.all": "Mọi thế kỷ",
      "century.bc": "TCN",
      "century.label": "Thế kỷ",

      "cite.title": "Trích dẫn trang này",
      "cite.copy": "Sao chép",
      "cite.copied": "Đã sao chép",
      "cite.close": "Đóng",

      "intro.kicker": "Chào mừng đến với",
      "intro.lead": "Dòng Chảy Lịch Sử là một thư viện số kể lại quá khứ của thế giới và Việt Nam — bằng hình ảnh, tư liệu, dòng thời gian và những con người đã làm nên lịch sử. Mỗi bài viết là một mảnh ký ức được gìn giữ và phân tích.",
      "intro.stat1": "Bài viết & tư liệu",
      "intro.stat2": "Nhân vật phân tích",
      "intro.stat3": "Thế kỷ lịch sử",
      "intro.explore.kicker": "Ba nhánh khám phá",
      "intro.explore.title": "Bạn muốn bắt đầu từ đâu?",
      "intro.explore.subtitle": "Chọn một dòng chảy để lần theo — thế giới, Việt Nam, hoặc những con người kiệt xuất.",
      "pillar.world.t": "Lịch sử Thế giới",
      "pillar.world.d": "Từ Con đường Tơ lụa đến bước chân lên Mặt Trăng — những cột mốc định hình nền văn minh nhân loại.",
      "pillar.vn.t": "Lịch sử Việt Nam",
      "pillar.vn.d": "Những trang sử hào hùng của dân tộc: dựng nước, giữ nước và khát vọng độc lập tự do.",
      "pillar.figures.t": "Nhân vật Lịch sử",
      "pillar.figures.d": "Chân dung và phân tích những con người đã thay đổi dòng chảy của thời đại họ.",
      "pillar.cta": "Khám phá",

      "figures.kicker": "Chân dung & Phân tích",
      "figures.title": "Nhân vật Lịch sử",
      "figures.subtitle": "Những con người kiệt xuất — được kể lại và phân tích qua lăng kính của thời đại họ.",
      "figures.group.vn": "Lịch sử Việt Nam",
      "figures.group.world": "Lịch sử Thế giới",
      "figures.analyze": "Đọc phân tích",
      "figures.empty": "Chưa có nhân vật nào.",
      "figure.back": "Quay lại danh sách nhân vật",
      "figure.born": "Sinh",
      "figure.died": "Mất",
      "figure.field": "Lĩnh vực",
      "figure.era": "Thời đại",
      "figure.notfound": "Không tìm thấy nhân vật",

      "region.all": "Tất cả",
      "region.vietnam": "Lịch sử Việt Nam",
      "region.world": "Lịch sử Thế giới",

      "hero.kicker": "Biên niên sử · Ký ức · Di sản",
      "hero.title": "LỊCH SỬ",
      "hero.subtitle":
        "Nơi những câu chuyện của quá khứ được kể lại — bằng hình ảnh, tư liệu và cảm xúc.",
      "hero.cta": "Khám phá bài viết",
      "hero.cta2": "Dòng thời gian",
      "hero.scroll": "Cuộn xuống",

      "timeline.kicker": "Dòng thời gian",
      "timeline.title": "Những cột mốc",
      "timeline.subtitle":
        "Lướt qua các mốc thời gian tiêu biểu được kể lại trên trang.",

      "latest.kicker": "Mới nhất",
      "latest.title": "Bài viết gần đây",
      "latest.subtitle": "Những trang sử mới nhất vừa được ghi lại.",
      "latest.all": "Xem tất cả bài viết",

      "featured.kicker": "Tiêu điểm",
      "featured.readmore": "Đọc tiếp",

      "blog.title": "Tất cả bài viết",
      "blog.subtitle": "Kho lưu trữ các câu chuyện lịch sử.",
      "blog.search": "Tìm kiếm bài viết…",
      "blog.all": "Tất cả",
      "blog.empty": "Chưa có bài viết nào phù hợp.",
      "blog.readtime": "phút đọc",

      "post.back": "Quay lại danh sách",
      "post.notfound": "Không tìm thấy bài viết",
      "post.notfounddesc": "Bài viết bạn tìm không tồn tại hoặc đã bị xóa.",
      "post.share": "Chia sẻ",
      "post.related": "Bài viết liên quan",
      "post.published": "Đăng ngày",

      "article.contents": "Mục lục",
      "article.infobox": "Thông tin nhanh",
      "article.region": "Khu vực",
      "article.period": "Mốc thời gian",
      "article.published": "Xuất bản",
      "article.reading": "Thời lượng đọc",
      "article.topics": "Chủ đề",
      "article.references": "Nguồn tham khảo",
      "article.categories": "Chuyên mục",
      "article.edit": "Sửa bài viết",
      "article.cite": "Trích dẫn trang này",
      "article.citecopied": "Đã sao chép trích dẫn",
      "article.top": "Về đầu trang",
      "article.by": "Biên soạn bởi",
      "article.verified": "Đã kiểm chứng",
      "article.verifiedhint": "Nội dung đã được đối chiếu nguồn.",
      "article.history": "Lịch sử sửa đổi",
      "article.correction": "Góp ý / Báo lỗi nguồn",
      "article.status": "Trạng thái",
      "comments.title": "Thảo luận & Góp ý",
      "comments.setup": "Bình luận chạy qua GitHub Discussions (Giscus). Bật trong config.js để kích hoạt.",

      "profile.role": "Người biên soạn · Sử liệu",
      "profile.badge1": "Tác giả",
      "profile.badge2": "Biên tập",
      "profile.follow": "Theo dõi",
      "profile.contact": "Liên hệ",
      "profile.followed": "Đang theo dõi",
      "profile.about": "Đôi nét",
      "profile.articles": "Bài viết đã đăng",
      "profile.figures": "Nhân vật đã biên soạn",
      "profile.stat.posts": "Bài viết",
      "profile.stat.figures": "Nhân vật",
      "profile.stat.topics": "Chủ đề",
      "profile.empty": "Chưa có bài viết nào.",

      "about.kicker": "Về chúng tôi",
      "about.title": "Kể lại lịch sử, theo cách của bạn",
      "about.body":
        "Đây là một trang blog lịch sử tĩnh, đẹp và nhẹ, chạy hoàn toàn trên GitHub Pages. Bạn có thể tự viết, chỉnh sửa và đăng bài ngay trên trình duyệt thông qua trang quản trị — mỗi bài được lưu vĩnh viễn trong repo dưới dạng Markdown.",
      "about.f1.t": "Song ngữ",
      "about.f1.d": "Chuyển đổi Tiếng Việt / English chỉ với một cú nhấp.",
      "about.f2.t": "Tự đăng bài",
      "about.f2.d": "Viết và xuất bản trực tiếp qua GitHub API, không cần server.",
      "about.f3.t": "Tự động deploy",
      "about.f3.d": "Mỗi lần đăng, GitHub Pages tự cập nhật website.",
      "about.f4.t": "Hiệu ứng đẹp",
      "about.f4.d": "Giao diện điện ảnh, chuyển động mượt mà, tôn trọng tư liệu.",

      "admin.title": "Trang quản trị",
      "admin.subtitle": "Viết và xuất bản bài mới trực tiếp lên repo.",
      "admin.token": "GitHub Personal Access Token",
      "admin.tokenhint":
        "Cần quyền 'repo' (Contents: read & write). Token chỉ lưu trong trình duyệt của bạn.",
      "admin.tokensave": "Lưu token",
      "admin.tokensaved": "Đã lưu token trong máy bạn.",
      "admin.connect": "Kết nối",
      "admin.connected": "Đã kết nối:",
      "admin.load": "Tải bài để sửa",
      "admin.new": "Bài mới",
      "admin.f.title": "Tiêu đề",
      "admin.f.slug": "Slug (đường dẫn)",
      "admin.f.date": "Ngày đăng",
      "admin.f.year": "Năm lịch sử (mốc thời gian)",
      "admin.f.region": "Khu vực",
      "admin.f.tags": "Thẻ (cách nhau bởi dấu phẩy)",
      "admin.f.type": "Loại nội dung",
      "admin.f.name": "Tên nhân vật",
      "admin.type.event": "Sự kiện lịch sử",
      "admin.type.figure": "Nhân vật lịch sử",
      "admin.f.born": "Năm sinh",
      "admin.f.died": "Năm mất",
      "admin.f.role": "Vai trò",
      "admin.f.field": "Lĩnh vực",
      "admin.f.era": "Thời kỳ lịch sử",
      "admin.f.location": "Vị trí trên bản đồ",
      "admin.locationhint": "Nhấp vào bản đồ để chọn nơi diễn ra sự kiện (hoặc nhập toạ độ bên dưới).",
      "admin.f.lat": "Vĩ độ (lat)",
      "admin.f.lng": "Kinh độ (lng)",
      "admin.f.place": "Địa danh",
      "admin.f.cover": "Ảnh bìa / chân dung (URL)",
      "admin.f.excerpt": "Tóm tắt ngắn",
      "admin.f.lang": "Ngôn ngữ",
      "admin.f.content": "Nội dung (Markdown)",
      "admin.preview": "Xem trước",
      "admin.publish": "Xuất bản lên repo",
      "admin.publishing": "Đang xuất bản…",
      "admin.import": "Nhập bài từ tệp",
      "admin.importdocx": "Nhập .docx",
      "admin.importmd": "Nhập .md",
      "admin.importhint": "Chuyển nội dung Word/Markdown thành bài viết. Ảnh trong .docx sẽ bị bỏ qua — hãy tải lại bằng nút Ảnh.",
      "admin.imported": "Đã nhập nội dung vào ô soạn thảo.",
      "admin.converting": "Đang chuyển đổi .docx…",
      "admin.uploadimg": "Tải ảnh",
      "admin.uploadcover": "Tải ảnh bìa",
      "admin.uploading": "Đang tải ảnh lên…",
      "admin.uploaded": "Đã tải ảnh lên (hiển thị sau khi deploy; xem trước ngay bằng nút Xem trước).",
      "admin.success": "Đã xuất bản! Pages sẽ cập nhật sau ít phút.",
      "admin.needtoken": "Vui lòng nhập và lưu GitHub token trước.",
      "admin.needfields": "Vui lòng nhập tiêu đề và nội dung.",
      "admin.confirmdelete": "Xóa bài viết này?",
      "admin.delete": "Xóa bài",
      "admin.deleted": "Đã xóa bài viết.",
      "admin.error": "Lỗi:",

      "footer.tagline": "Mỗi trang là một mảnh ký ức.",
      "footer.nav": "Điều hướng",
      "footer.made": "Xây dựng bằng HTML, CSS & JavaScript. Deploy trên GitHub Pages.",
      "footer.rights": "Bảo lưu mọi quyền.",

      "lang.switch": "EN",
    },

    en: {
      "nav.home": "Home",
      "nav.blog": "Articles",
      "nav.figures": "Figures",
      "nav.timeline": "Timeline",
      "nav.about": "About",
      "nav.profile": "Profile",
      "nav.admin": "Admin",
      "nav.menu": "Menu",

      "search.open": "Search",
      "search.placeholder": "Search articles, figures, full text…",
      "search.hint": "Press Ctrl / ⌘ + K to search · Esc to close",
      "search.none": "No matching results.",
      "search.recent": "Recent searches",
      "search.suggested": "Suggested topics",

      "nav.topics": "Topics",
      "nav.atlas": "Atlas",
      "nav.gallery": "Media",

      "topics.kicker": "Browse by topic",
      "topics.title": "Topics",
      "topics.subtitle": "Each topic gathers every related article and figure — a doorway into the current.",
      "topics.count": "items",
      "topic.kicker": "Topic",
      "topic.posts": "Articles",
      "topic.figures": "Figures",
      "topic.empty": "No content for this topic yet.",
      "topic.back": "All topics",

      "atlas.kicker": "Space & Time",
      "atlas.title": "Atlas & Timeline",
      "atlas.subtitle": "Trace history through place and time — click a point or a milestone to open the article.",
      "atlas.map": "Event map",
      "atlas.timeline": "Interactive timeline",
      "atlas.nocoord": "Events without coordinates",
      "atlas.all": "All",

      "gallery.kicker": "Media library",
      "gallery.title": "Media & Images",
      "gallery.subtitle": "The images used across the site, with their sources and attribution.",
      "gallery.source": "Source",
      "gallery.view": "Open article",

      "century.all": "All centuries",
      "century.bc": "BC",
      "century.label": "Century",

      "cite.title": "Cite this page",
      "cite.copy": "Copy",
      "cite.copied": "Copied",
      "cite.close": "Close",

      "intro.kicker": "Welcome to",
      "intro.lead": "The Flow of History is a digital library retelling the past of the world and Vietnam — through images, records, timelines and the people who shaped history. Each article is a fragment of memory, preserved and analysed.",
      "intro.stat1": "Articles & records",
      "intro.stat2": "Figures analysed",
      "intro.stat3": "Centuries covered",
      "intro.explore.kicker": "Three paths to explore",
      "intro.explore.title": "Where would you like to begin?",
      "intro.explore.subtitle": "Pick a current to follow — the world, Vietnam, or the remarkable people who bent their age.",
      "pillar.world.t": "World History",
      "pillar.world.d": "From the Silk Road to the step onto the Moon — the milestones that shaped human civilisation.",
      "pillar.vn.t": "Vietnamese History",
      "pillar.vn.d": "The proud chronicle of a nation: founding, defending and the enduring longing for independence.",
      "pillar.figures.t": "Historical Figures",
      "pillar.figures.d": "Portraits and analysis of the people who changed the course of their era.",
      "pillar.cta": "Explore",

      "figures.kicker": "Portraits & Analysis",
      "figures.title": "Historical Figures",
      "figures.subtitle": "Remarkable people — retold and analysed through the lens of their time.",
      "figures.group.vn": "Vietnamese History",
      "figures.group.world": "World History",
      "figures.analyze": "Read analysis",
      "figures.empty": "No figures yet.",
      "figure.back": "Back to figures",
      "figure.born": "Born",
      "figure.died": "Died",
      "figure.field": "Field",
      "figure.era": "Era",
      "figure.notfound": "Figure not found",

      "region.all": "All",
      "region.vietnam": "Vietnamese History",
      "region.world": "World History",

      "hero.kicker": "Chronicle · Memory · Heritage",
      "hero.title": "HISTORY",
      "hero.subtitle":
        "Where the stories of the past are retold — through images, records and emotion.",
      "hero.cta": "Explore articles",
      "hero.cta2": "Timeline",
      "hero.scroll": "Scroll",

      "timeline.kicker": "Timeline",
      "timeline.title": "Milestones",
      "timeline.subtitle": "Glide through the defining moments told on this site.",

      "latest.kicker": "Latest",
      "latest.title": "Recent articles",
      "latest.subtitle": "The newest pages of history, freshly written.",
      "latest.all": "View all articles",

      "featured.kicker": "Featured",
      "featured.readmore": "Read more",

      "blog.title": "All articles",
      "blog.subtitle": "An archive of historical stories.",
      "blog.search": "Search articles…",
      "blog.all": "All",
      "blog.empty": "No matching articles yet.",
      "blog.readtime": "min read",

      "post.back": "Back to list",
      "post.notfound": "Article not found",
      "post.notfounddesc": "The article you are looking for does not exist or was removed.",
      "post.share": "Share",
      "post.related": "Related articles",
      "post.published": "Published on",

      "article.contents": "Contents",
      "article.infobox": "Quick facts",
      "article.region": "Region",
      "article.period": "Period",
      "article.published": "Published",
      "article.reading": "Reading time",
      "article.topics": "Topics",
      "article.references": "References",
      "article.categories": "Categories",
      "article.edit": "Edit article",
      "article.cite": "Cite this page",
      "article.citecopied": "Citation copied",
      "article.top": "Back to top",
      "article.by": "Curated by",
      "article.verified": "Verified",
      "article.verifiedhint": "Content cross-checked against sources.",
      "article.history": "Revision history",
      "article.correction": "Suggest a correction",
      "article.status": "Status",
      "comments.title": "Discussion & Feedback",
      "comments.setup": "Comments run on GitHub Discussions (Giscus). Enable it in config.js to activate.",

      "profile.role": "Curator · Historical records",
      "profile.badge1": "Author",
      "profile.badge2": "Editor",
      "profile.follow": "Follow",
      "profile.contact": "Contact",
      "profile.followed": "Following",
      "profile.about": "About",
      "profile.articles": "Published articles",
      "profile.figures": "Figures curated",
      "profile.stat.posts": "Articles",
      "profile.stat.figures": "Figures",
      "profile.stat.topics": "Topics",
      "profile.empty": "No articles yet.",

      "about.kicker": "About",
      "about.title": "Retelling history, your way",
      "about.body":
        "This is a lightweight, beautiful static history blog running entirely on GitHub Pages. You can write, edit and publish posts right in your browser through the admin page — each article is stored permanently in the repo as Markdown.",
      "about.f1.t": "Bilingual",
      "about.f1.d": "Switch between Vietnamese / English with one click.",
      "about.f2.t": "Self-publishing",
      "about.f2.d": "Write and publish straight through the GitHub API, no server needed.",
      "about.f3.t": "Auto deploy",
      "about.f3.d": "Every publish updates the site automatically via GitHub Pages.",
      "about.f4.t": "Beautiful motion",
      "about.f4.d": "A cinematic interface with smooth motion that honors the material.",

      "admin.title": "Admin panel",
      "admin.subtitle": "Write and publish new posts straight to the repo.",
      "admin.token": "GitHub Personal Access Token",
      "admin.tokenhint":
        "Needs 'repo' scope (Contents: read & write). The token is stored only in your browser.",
      "admin.tokensave": "Save token",
      "admin.tokensaved": "Token saved on your device.",
      "admin.connect": "Connect",
      "admin.connected": "Connected:",
      "admin.load": "Load a post to edit",
      "admin.new": "New post",
      "admin.f.title": "Title",
      "admin.f.slug": "Slug (URL)",
      "admin.f.date": "Publish date",
      "admin.f.year": "Historical year (timeline)",
      "admin.f.region": "Region",
      "admin.f.tags": "Tags (comma separated)",
      "admin.f.type": "Content type",
      "admin.f.name": "Figure name",
      "admin.type.event": "Historical event",
      "admin.type.figure": "Historical figure",
      "admin.f.born": "Born",
      "admin.f.died": "Died",
      "admin.f.role": "Role",
      "admin.f.field": "Field",
      "admin.f.era": "Historical period",
      "admin.f.location": "Map location",
      "admin.locationhint": "Click the map to set where the event happened (or type coordinates below).",
      "admin.f.lat": "Latitude (lat)",
      "admin.f.lng": "Longitude (lng)",
      "admin.f.place": "Place name",
      "admin.f.cover": "Cover / portrait (URL)",
      "admin.f.excerpt": "Short excerpt",
      "admin.f.lang": "Language",
      "admin.f.content": "Content (Markdown)",
      "admin.preview": "Preview",
      "admin.publish": "Publish to repo",
      "admin.publishing": "Publishing…",
      "admin.import": "Import from file",
      "admin.importdocx": "Import .docx",
      "admin.importmd": "Import .md",
      "admin.importhint": "Turn a Word/Markdown file into an article. Images inside .docx are skipped — re-add them with the Image button.",
      "admin.imported": "Content imported into the editor.",
      "admin.converting": "Converting .docx…",
      "admin.uploadimg": "Upload image",
      "admin.uploadcover": "Upload cover",
      "admin.uploading": "Uploading image…",
      "admin.uploaded": "Image uploaded (shows after deploy; use Preview to see it now).",
      "admin.success": "Published! Pages will update in a few minutes.",
      "admin.needtoken": "Please enter and save a GitHub token first.",
      "admin.needfields": "Please enter a title and content.",
      "admin.confirmdelete": "Delete this article?",
      "admin.delete": "Delete post",
      "admin.deleted": "Article deleted.",
      "admin.error": "Error:",

      "footer.tagline": "Every page is a fragment of memory.",
      "footer.nav": "Navigation",
      "footer.made": "Built with HTML, CSS & JavaScript. Deployed on GitHub Pages.",
      "footer.rights": "All rights reserved.",

      "lang.switch": "VI",
    },
  };

  const cfg = window.SITE_CONFIG || {};
  const DEFAULT = cfg.defaultLang || "vi";

  const I18N = {
    lang: localStorage.getItem("hw_lang") || DEFAULT,
    strings: STRINGS,

    t(key) {
      const dict = STRINGS[this.lang] || STRINGS[DEFAULT];
      return (dict && dict[key]) || (STRINGS[DEFAULT] && STRINGS[DEFAULT][key]) || key;
    },

    apply(root) {
      const scope = root || document;
      scope.querySelectorAll("[data-i18n]").forEach((el) => {
        el.textContent = this.t(el.getAttribute("data-i18n"));
      });
      scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
        el.innerHTML = this.t(el.getAttribute("data-i18n-html"));
      });
      scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
        // format: "placeholder:blog.search|title:nav.home"
        el.getAttribute("data-i18n-attr")
          .split("|")
          .forEach((pair) => {
            const [attr, key] = pair.split(":");
            if (attr && key) el.setAttribute(attr.trim(), this.t(key.trim()));
          });
      });
      document.documentElement.lang = this.lang;
      // Cập nhật nút chuyển ngôn ngữ
      scope.querySelectorAll("[data-lang-toggle]").forEach((el) => {
        el.textContent = this.t("lang.switch");
      });
    },

    set(lang) {
      if (!STRINGS[lang]) return;
      this.lang = lang;
      localStorage.setItem("hw_lang", lang);
      this.apply(document);
      window.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
    },

    toggle() {
      this.set(this.lang === "vi" ? "en" : "vi");
    },
  };

  window.I18N = I18N;
})();
