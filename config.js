/*
 * Cấu hình toàn site. Chỉnh các giá trị dưới đây cho khớp repo của bạn.
 * Trang admin dùng repoOwner/repoName/branch để commit bài viết qua GitHub API.
 */
window.SITE_CONFIG = {
  // Thông tin repo dùng cho trang admin (đăng/sửa bài qua GitHub API)
  repoOwner: "ducnguyenzz2208-wq",
  repoName: "historyweb",
  branch: "main",

  // Tên hiển thị của website
  siteName: {
    vi: "Dòng Chảy Lịch Sử",
    en: "The Flow of History",
  },

  // Ngôn ngữ mặc định: "vi" hoặc "en"
  defaultLang: "vi",

  // Trang cá nhân (người biên soạn / chủ trang)
  profile: {
    name: "Đức Nguyễn",
    avatar: "", // để trống sẽ dùng chữ cái đầu; hoặc dán URL ảnh
    tagline: {
      vi: "Người yêu lịch sử, gìn giữ và kể lại những trang sử của thế giới và Việt Nam.",
      en: "A history enthusiast preserving and retelling the pages of world and Vietnamese history.",
    },
    bio: {
      vi: "Tôi xây dựng Dòng Chảy Lịch Sử như một thư viện số mở — nơi mỗi sự kiện, mỗi con người đều có thể được tra cứu, đối chiếu và cảm nhận. Mục tiêu là biến những trang sử khô khan thành câu chuyện sống động, có nguồn dẫn rõ ràng.",
      en: "I built The Flow of History as an open digital library — where every event and figure can be searched, cross-referenced and felt. The goal is to turn dry history into living, well-sourced stories.",
    },
    joined: "2026",
    location: { vi: "Việt Nam", en: "Vietnam" },
    contact: "mailto:duczz2208@gmail.com",
    github: "https://github.com/ducnguyenzz2208-wq/historyweb",
  },
};
