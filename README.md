# Dòng Chảy Lịch Sử — Blog lịch sử song ngữ

Một website blog lịch sử **tĩnh** (HTML/CSS/JavaScript thuần), giao diện điện ảnh, hiệu ứng mượt, **song ngữ Việt – Anh**, tự động deploy lên **GitHub Pages**. Bạn có thể viết, sửa và xoá bài **ngay trên trình duyệt** thông qua trang quản trị — không cần server riêng.

## ✨ Tính năng

- **Giao diện đẹp, điện ảnh**: chủ đề giấy da / rượu vang, phông chữ lịch sử (Playfair · Cinzel · EB Garamond · Be Vietnam Pro), **liquid glass**, chuyển động tinh tế, chế độ Sáng/Tối.
- **Bài viết kiểu bách khoa/báo**: infobox tra cứu, mục lục tự động, dòng dẫn, chuyên mục, trích dẫn, thanh tiến trình đọc.
- **Tra cứu toàn trang**: tìm kiếm bài viết + nhân vật (không phân biệt dấu), phím tắt `Ctrl/⌘ + K`.
- **Nhân vật Lịch sử**: trang chân dung & phân tích, nhóm theo Việt Nam / Thế giới.
- **Trang cá nhân**: hồ sơ người biên soạn với thẻ kính lỏng.
- **Song ngữ (i18n)**: chuyển đổi Tiếng Việt / English chỉ với một nút bấm.
- **Tự đăng & sửa bài qua GitHub API**: `/admin.html` có thanh công cụ Markdown; sửa nhanh từ bài viết (`admin.html?slug=…`).
- **Tự động deploy**: mỗi lần đăng/sửa bài, GitHub Pages tự cập nhật website.

Xem lộ trình chi tiết trong [`progress.md`](progress.md).

## 📁 Cấu trúc

```
.
├── index.html          # Trang chủ kiêm giới thiệu (hero, tổng quan, 3 nhánh, timeline, bài viết)
├── blog.html           # Danh sách bài viết (tìm kiếm, lọc khu vực + thẻ)
├── post.html           # Trang đọc một bài kiểu bách khoa (?slug=...)
├── figures.html        # Nhân vật Lịch sử (danh sách theo khu vực)
├── figure.html         # Trang phân tích một nhân vật (?slug=...)
├── profile.html        # Trang cá nhân người biên soạn
├── admin.html          # Trang quản trị (đăng/sửa/xoá bài)
├── config.js           # Cấu hình repo, tên site, hồ sơ cá nhân, ngôn ngữ
├── assets/
│   ├── css/style.css   # Toàn bộ giao diện
│   └── js/
│       ├── i18n.js     # Hệ thống đa ngôn ngữ
│       ├── md.js       # Bộ chuyển Markdown → HTML (có id tiêu đề cho mục lục)
│       ├── store.js    # Tải dữ liệu bài viết
│       ├── main.js     # Header/footer, tra cứu, theme, hiệu ứng chung
│       ├── home.js     # Nội dung động trang chủ
│       ├── blog.js     # Danh sách + tìm kiếm + lọc khu vực
│       ├── post.js     # Render bài đơn (infobox, mục lục, trích dẫn)
│       ├── figures.js  # Danh sách nhân vật
│       ├── figure.js   # Trang chi tiết nhân vật
│       ├── profile.js  # Trang cá nhân
│       └── admin.js    # Editor commit qua GitHub API
├── posts/              # index.json + *.md (bài viết)
├── figures/            # index.json + *.md (nhân vật)
└── .github/workflows/deploy.yml   # Tự động deploy lên Pages
```

## 🚀 Kích hoạt GitHub Pages

1. Vào **Settings → Pages** của repo.
2. Ở mục **Build and deployment → Source**, chọn **GitHub Actions**.
3. Push code lên nhánh đã cấu hình trong `deploy.yml` → website tự deploy.
4. Địa chỉ mặc định: `https://<tên-user>.github.io/historyweb/`

## ✍️ Cách đăng bài (trang quản trị)

1. Tạo **Personal Access Token** trên GitHub với quyền **Contents: Read & Write** cho repo này.
   - *Fine-grained token* (khuyên dùng): Repository access → chọn repo → Permissions → Contents: Read and write.
   - Hoặc *Classic token* với scope `repo`.
2. Mở `admin.html`, dán token vào ô và bấm **Lưu token** (token chỉ lưu trong trình duyệt của bạn).
3. Điền tiêu đề, năm lịch sử, thẻ, ảnh bìa, tóm tắt và nội dung Markdown.
4. Bấm **Xem trước** để kiểm tra, rồi **Xuất bản lên repo**.
5. GitHub Pages sẽ tự cập nhật sau ít phút.

> ⚠️ Token là chìa khoá ghi vào repo. Không chia sẻ token và không commit nó vào code. Trang admin chỉ lưu token trong `localStorage` của trình duyệt và chỉ gọi tới `api.github.com`.

## 🌐 Chạy thử ở máy

Vì các trang tải dữ liệu qua `fetch`, hãy chạy qua một web server tĩnh (không mở trực tiếp bằng `file://`):

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

## ⚙️ Tùy chỉnh

- Đổi tên site, repo, nhánh, ngôn ngữ mặc định trong `config.js`.
- Thêm/bớt chuỗi dịch trong `assets/js/i18n.js`.
- Đổi bảng màu / phông chữ trong phần `:root` của `assets/css/style.css`.
