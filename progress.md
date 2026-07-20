# 📜 Dòng Chảy Lịch Sử — Tiến độ & Lộ trình

> Tài liệu này ghi lại **đã làm gì** và **cần làm gì** để đưa trang thành một
> **bách khoa lịch sử tra cứu được** (giống báo điện tử + Wikipedia), song ngữ Việt–Anh,
> chạy tĩnh trên GitHub Pages.

Cập nhật lần cuối: **2026-07-20**

---

## 🎯 Tầm nhìn

Một **thư viện lịch sử mở**, nơi mỗi sự kiện và nhân vật đều:
- Tra cứu được (tìm kiếm toàn trang, mục lục, liên kết chéo).
- Có nguồn dẫn rõ ràng (trích dẫn, tham khảo).
- Đẹp và mượt (giao diện điện ảnh, kính lỏng, chuyển động tinh tế).
- Ai cũng đóng góp được (tự viết & xuất bản ngay trên trình duyệt).

---

## ✅ Đã hoàn thành

### Giao diện & thương hiệu
- [x] Bộ chữ lịch sử: Playfair Display + **Cinzel** (khắc đá La Mã) + **EB Garamond** (thư tịch) + **Be Vietnam Pro**.
- [x] Hệ màu rượu vang / vàng / kem thống nhất, hỗ trợ **sáng/tối**.
- [x] **Liquid glass** toàn site: header, thẻ, ô tìm kiếm, chip, infobox, mục lục, thẻ hồ sơ, panel admin…
- [x] Chuyển động: aurora nền, nút nam châm, thẻ nghiêng 3D, đếm số, reveal so le, sheen — đều tôn trọng `prefers-reduced-motion`.

### Cấu trúc trang
- [x] **Trang chủ** kiêm giới thiệu: hero → tóm tắt → 3 nhánh khám phá → dòng thời gian → nổi bật → mới nhất → “Về trang này”.
- [x] Gỡ mục **Giới thiệu** riêng, gộp nội dung vào trang chủ.
- [x] **Bài viết** (Bài viết): tìm kiếm + lọc theo **khu vực** (Việt Nam / Thế giới) + lọc theo thẻ, deep-link `?region=` & `?tag=`.
- [x] **Nhân vật Lịch sử**: trang danh sách (nhóm VN/Thế giới) + trang chi tiết có phân tích. 6 nhân vật mẫu.
- [x] **Trang cá nhân**: thẻ hồ sơ kính lỏng (avatar, huy hiệu, theo dõi/liên hệ), chỉ số, danh sách bài đã đăng.

### Bài viết kiểu bách khoa / báo
- [x] **Infobox** tra cứu (ảnh, khu vực, mốc thời gian, ngày xuất bản, thời lượng đọc, chủ đề).
- [x] **Mục lục tự động** từ tiêu đề `##`/`###`, dính lề, tô sáng mục đang đọc.
- [x] Dòng dẫn (lead) có chữ cái lớn, thanh công cụ **Sửa · Trích dẫn · Chia sẻ**.
- [x] Khối **Chuyên mục** cuối bài, nút “Về đầu trang”, thanh tiến trình đọc.
- [x] Nút **Trích dẫn trang này** (copy nguồn dẫn nhanh).

### Tra cứu
- [x] **Tìm kiếm toàn trang** (overlay, phím tắt `Ctrl/⌘ + K`) trên cả bài viết lẫn nhân vật.

### Soạn thảo (admin)
- [x] Đăng / **sửa** / xóa bài, commit thẳng lên repo qua GitHub API (token lưu trong trình duyệt).
- [x] **Sửa nhanh** từ bài viết: nút “Sửa bài viết” mở `admin.html?slug=…` và nạp sẵn.
- [x] **Thanh công cụ Markdown** (H2/H3, đậm, nghiêng, trích dẫn, danh sách, liên kết, ảnh, kẻ ngang, mục tham khảo).
- [x] Trường **Khu vực** để phân loại bài.

### Hạ tầng
- [x] Deploy tự động lên GitHub Pages (Actions) khi push nhánh `main`.
- [x] Không phụ thuộc thư viện ngoài, tải nhanh.

---

## 🚧 Đang / nên làm tiếp (ưu tiên gần)

- [ ] **Chú thích nguồn kiểu Wikipedia** `[^1]`: footnote đánh số tự động + danh sách tham khảo ở cuối (nâng cấp `md.js`).
- [ ] **Song ngữ cho thân bài**: hiện tiêu đề/tóm tắt đã song ngữ, nội dung Markdown mới một ngôn ngữ — cho phép lưu `content.vi` + `content.en`.
- [ ] **Ảnh trong admin**: dán ảnh / kéo-thả upload thẳng vào repo (`assets/uploads/`).
- [ ] **Biên soạn nhân vật trong admin** (hiện nhân vật phải sửa file JSON thủ công).
- [ ] **Trang “Sự kiện theo năm”** / dòng thời gian toàn màn hình có thể lọc.
- [ ] **Breadcrumb** & liên kết chéo tự động giữa bài ↔ nhân vật ↔ chủ đề.

---

## 🌟 Lộ trình tương lai (web “xịn”)

### Giai đoạn 1 — Tra cứu sâu
- [ ] **Tìm kiếm toàn văn** (index nội dung .md) + gợi ý & lịch sử tìm kiếm.
- [ ] Bộ lọc nâng cao: theo **thế kỷ**, khu vực, nhân vật liên quan.
- [ ] **Trang chủ đề** (tag hub) tổng hợp mọi bài + nhân vật cùng chủ đề.

### Giai đoạn 2 — Nội dung phong phú
- [ ] **Bản đồ lịch sử** (sự kiện gắn toạ độ) và **dòng thời gian tương tác**.
- [ ] Thư viện ảnh/tư liệu, chú thích nguồn gốc, giấy phép.
- [ ] Trích dẫn chuẩn (APA/MLA) tự sinh cho mỗi trang.

### Giai đoạn 3 — Cộng đồng & độ tin cậy
- [ ] Nhiều tác giả (mỗi người một trang cá nhân thật) + lịch sử sửa đổi.
- [ ] Bình luận / góp ý nguồn (qua GitHub Issues hoặc Giscus).
- [ ] Nhãn “đã kiểm chứng”, phiên bản bài viết.

### Giai đoạn 4 — Nền tảng
- [ ] PWA (đọc offline), `sitemap.xml`, RSS, Open Graph/SEO đầy đủ.
- [ ] Kiểm thử tự động + kiểm tra liên kết hỏng.
- [ ] Tối ưu ảnh (WebP), lazy-load, điểm Lighthouse ≥ 95.

---

## 🗂 Bản đồ mã nguồn

| Khu vực | Tệp |
|---|---|
| Trang | `index.html` (chủ+giới thiệu), `blog.html`, `post.html`, `figures.html`, `figure.html`, `profile.html`, `admin.html` |
| Logic chung | `assets/js/main.js` (header/footer, tra cứu, chuyển động), `i18n.js`, `store.js`, `md.js` |
| Theo trang | `home.js`, `blog.js`, `post.js`, `figures.js`, `figure.js`, `profile.js`, `admin.js` |
| Dữ liệu | `posts/index.json` + `posts/*.md`, `figures/index.json` + `figures/*.md` |
| Cấu hình | `config.js` (repo, tên site, hồ sơ cá nhân, ngôn ngữ) |
| Giao diện | `assets/css/style.css` |
| Deploy | `.github/workflows/deploy.yml` |

---

## 🔧 Cách vận hành nhanh

1. **Viết bài**: mở `admin.html` → dán GitHub token (quyền `repo`) → soạn → *Xuất bản*.
2. **Sửa bài**: mở bài → bấm **Sửa bài viết**, hoặc vào admin chọn bài trong danh sách.
3. **Thêm nhân vật**: thêm mục vào `figures/index.json` và tạo `figures/<slug>.md`.
4. **Đổi hồ sơ cá nhân**: sửa `profile` trong `config.js`.
5. **Xuất bản trang**: bật GitHub Pages (Settings → Pages → Source: *GitHub Actions*); mỗi lần push `main` sẽ tự deploy.
