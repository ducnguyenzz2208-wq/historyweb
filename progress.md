# 📜 Dòng Chảy Lịch Sử — Tiến độ & Lộ trình

> Tài liệu này ghi lại **đã làm gì** và **cần làm gì** để đưa trang thành một
> **bách khoa lịch sử tra cứu được** (giống báo điện tử + Wikipedia), song ngữ Việt–Anh,
> chạy tĩnh trên GitHub Pages.

Cập nhật lần cuối: **2026-07-20** · Đã hoàn thành **Giai đoạn 1 → 4**. Bản đồ dùng **GeoJSON thế giới thật**.

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

### Tra cứu & khám phá
- [x] **Tìm kiếm toàn văn** (overlay, `Ctrl/⌘ + K`) trên tiêu đề, tóm tắt **và nội dung** bài viết + nhân vật; không phân biệt dấu; trích đoạn; gợi ý + lịch sử.
- [x] **Trang Chủ đề** (tag hub) tổng hợp bài viết + nhân vật cùng chủ đề.
- [x] **Bản đồ & Niên biểu** (`atlas.html`): bản đồ sự kiện theo toạ độ + niên biểu tương tác.
- [x] **Thư viện tư liệu** (`gallery.html`) kèm ghi công nguồn ảnh.
- [x] Bộ lọc **thế kỷ** + khu vực + thẻ trên trang Bài viết.
- [x] **Trích dẫn** APA / MLA / Chicago cho mỗi bài.

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
- [x] **Ảnh trong admin**: tải ảnh từ máy + **dán ảnh** thẳng vào ô nội dung → tự upload vào `assets/uploads/` và chèn Markdown; nút **Tải ảnh bìa**.
- [x] **Nhập bài từ `.docx` / `.md`**: chuyển Word (mammoth) & Markdown thành bài viết, tự lấy tiêu đề.
- [x] **Sửa lỗi 409** khi xuất bản (cache `no-store` + tự thử lại với sha mới).
- [ ] **Biên soạn nhân vật trong admin** (hiện nhân vật phải sửa file JSON thủ công).
- [x] ~~Trang “Sự kiện theo năm” / dòng thời gian có thể lọc~~ → đã có ở `atlas.html`.
- [ ] **Breadcrumb** & liên kết chéo tự động giữa bài ↔ nhân vật ↔ chủ đề.

---

## 🌟 Lộ trình tương lai (web “xịn”)

### Giai đoạn 1 — Tra cứu sâu ✅ (hoàn thành 2026-07-20)
- [x] **Tìm kiếm toàn văn** (index cả nội dung .md), trích đoạn quanh từ khoá, **không phân biệt dấu**, kèm **gợi ý chủ đề & lịch sử tra cứu**.
- [x] Bộ lọc nâng cao trên trang Bài viết: theo **thế kỷ** + khu vực + thẻ; nhân vật liên quan liên kết qua thẻ chung.
- [x] **Trang Chủ đề** (`topics.html`) — tag hub tổng hợp mọi bài viết + nhân vật cùng chủ đề (`?tag=`).

### Giai đoạn 2 — Nội dung phong phú ✅ (hoàn thành 2026-07-20)
- [x] **Bản đồ sự kiện** (`atlas.html`) — ghim theo toạ độ thật (phép chiếu equirectangular, phong cách bản đồ cổ) + **niên biểu tương tác** gộp bài viết & nhân vật, lọc theo khu vực.
- [x] **Thư viện tư liệu** (`gallery.html`) — mọi hình ảnh kèm nguồn gốc / ghi công (Unsplash, Wikimedia Commons).
- [x] **Trích dẫn chuẩn** APA / MLA / Chicago tự sinh cho mỗi bài (hộp thoại sao chép nhanh).

### Giai đoạn 3 — Cộng đồng & độ tin cậy ✅ (hoàn thành 2026-07-20)
- [x] **Dòng dẫn tác giả** (byline) trên mỗi bài, liên kết tới trang cá nhân + **lịch sử sửa đổi** (mở commit của tệp trên GitHub).
- [x] **Góp ý / Báo lỗi nguồn** mở sẵn GitHub Issue; **bình luận Giscus** (tuỳ chọn, bật trong `config.js`).
- [x] Nhãn **“Đã kiểm chứng”** (trường `verified` trên bài) + phiên bản bài xem qua lịch sử commit.
- [ ] *Còn lại:* hạ tầng nhiều tác giả thật (mỗi người một hồ sơ riêng) — hiện dùng một hồ sơ trong `config.js`.

### Giai đoạn 4 — Nền tảng ✅ (hoàn thành 2026-07-20)
- [x] **PWA**: `manifest.webmanifest` + `sw.js` (đọc offline, network-first), icon, theme-color.
- [x] **SEO/OG**: thẻ Open Graph + Twitter + canonical (động cho bài & nhân vật), `sitemap.xml`, `robots.txt`.
- [x] **RSS**: `rss.xml` sinh tự động từ `scripts/build-feeds.mjs` (chạy trong deploy).
- [x] **Kiểm thử tự động**: `scripts/check-links.mjs` + workflow CI kiểm tra liên kết hỏng mỗi lần push/PR.
- [x] Ảnh **lazy-load** + ảnh dự phòng; *còn lại:* chuyển ảnh cục bộ sang WebP để đạt Lighthouse ≥ 95.

---

## 🗂 Bản đồ mã nguồn

| Khu vực | Tệp |
|---|---|
| Trang | `index.html` (chủ+giới thiệu), `blog.html`, `post.html`, `figures.html`, `figure.html`, `topics.html`, `atlas.html`, `gallery.html`, `profile.html`, `admin.html` |
| Logic chung | `assets/js/main.js` (header/footer, tra cứu toàn văn, chuyển động), `i18n.js`, `store.js`, `md.js` |
| Theo trang | `home.js`, `blog.js`, `post.js`, `figures.js`, `figure.js`, `topics.js`, `atlas.js`, `gallery.js`, `profile.js`, `admin.js` |
| Dữ liệu | `posts/index.json` (+ `lat`/`lng`/`place`/`credit`) + `posts/*.md`, `figures/index.json` (+ `tags`/`credit`) + `figures/*.md` |
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
