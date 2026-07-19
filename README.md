# Dòng Chảy Lịch Sử — Blog lịch sử song ngữ

Một website blog lịch sử **tĩnh** (HTML/CSS/JavaScript thuần), giao diện điện ảnh, hiệu ứng mượt, **song ngữ Việt – Anh**, tự động deploy lên **GitHub Pages**. Bạn có thể viết, sửa và xoá bài **ngay trên trình duyệt** thông qua trang quản trị — không cần server riêng.

## ✨ Tính năng

- **Giao diện đẹp, điện ảnh**: chủ đề giấy da / rượu vang, typography serif cổ điển, hiệu ứng cuộn, timeline tương tác, chế độ Sáng/Tối.
- **Song ngữ (i18n)**: chuyển đổi Tiếng Việt / English chỉ với một nút bấm.
- **Tự đăng bài qua GitHub API**: trang `/admin.html` cho phép viết Markdown và commit thẳng lên repo.
- **Tự động deploy**: mỗi lần đăng/sửa bài, GitHub Pages tự cập nhật website.
- **Không phụ thuộc build phức tạp**: mọi thứ chạy trực tiếp trên trình duyệt.

## 📁 Cấu trúc

```
.
├── index.html          # Trang chủ (hero, timeline, bài nổi bật, bài mới)
├── blog.html           # Danh sách bài viết (tìm kiếm, lọc theo thẻ)
├── post.html           # Trang đọc một bài (?slug=...)
├── about.html          # Giới thiệu
├── admin.html          # Trang quản trị (đăng/sửa/xoá bài)
├── config.js           # Cấu hình repo, tên site, ngôn ngữ mặc định
├── assets/
│   ├── css/style.css   # Toàn bộ giao diện
│   └── js/
│       ├── i18n.js     # Hệ thống đa ngôn ngữ
│       ├── md.js       # Bộ chuyển Markdown → HTML
│       ├── store.js    # Tải dữ liệu bài viết
│       ├── main.js     # Header/footer, theme, hiệu ứng chung
│       ├── home.js     # Nội dung động trang chủ
│       ├── blog.js     # Danh sách + tìm kiếm
│       ├── post.js     # Render bài đơn
│       └── admin.js    # Editor commit qua GitHub API
├── posts/
│   ├── index.json      # Mục lục bài viết (metadata)
│   └── *.md            # Nội dung từng bài (Markdown)
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
