# Dòng Chảy Lịch Sử — Blog lịch sử song ngữ

Một website blog lịch sử **tĩnh** (HTML/CSS/JavaScript thuần), giao diện điện ảnh, hiệu ứng mượt, **song ngữ Việt – Anh**, tự động deploy lên **GitHub Pages**. Bạn có thể viết, sửa và xoá bài **ngay trên trình duyệt** thông qua trang quản trị — không cần server riêng.

## ✨ Tính năng

- **Giao diện đẹp, điện ảnh**: chủ đề giấy da / rượu vang, phông chữ lịch sử (Playfair · Cinzel · EB Garamond · Be Vietnam Pro), **liquid glass**, chuyển động tinh tế, chế độ Sáng/Tối.
- **Bài viết kiểu bách khoa/báo**: infobox tra cứu, mục lục tự động, dòng dẫn, chuyên mục, trích dẫn **APA/MLA/Chicago**, thanh tiến trình đọc.
- **Tra cứu toàn văn**: tìm kiếm cả nội dung bài + nhân vật (không phân biệt dấu), trích đoạn, gợi ý & lịch sử, phím tắt `Ctrl/⌘ + K`.
- **Khám phá**: trang Chủ đề (tag hub), Bản đồ sự kiện + niên biểu tương tác, Thư viện tư liệu; lọc theo thế kỷ / khu vực / thẻ.
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
├── topics.html         # Chủ đề — tag hub (bài + nhân vật cùng chủ đề)
├── atlas.html          # Bản đồ sự kiện theo toạ độ + niên biểu tương tác
├── gallery.html        # Thư viện tư liệu ảnh (kèm ghi công nguồn)
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

## 🔑 Tạo & kích hoạt GitHub Token (để đăng bài)

Trang **admin** ghi bài thẳng vào repo qua GitHub API, nên cần một **Personal Access Token**.
Khuyên dùng **Fine-grained token** (an toàn hơn, chỉ cấp quyền cho đúng 1 repo):

1. Mở https://github.com/settings/tokens?type=beta → **Generate new token**.
2. **Token name**: ví dụ `historyweb-admin`. **Expiration**: chọn thời hạn (vd 90 ngày).
3. **Repository access** → **Only select repositories** → chọn `ducnguyenzz2208-wq/historyweb`.
4. **Permissions** → **Repository permissions** → **Contents** → chọn **Read and write**.
   (Chỉ cần quyền này; các quyền khác để mặc định No access.)
5. **Generate token** → **sao chép ngay** chuỗi `github_pat_…` (chỉ hiện một lần).
6. Mở trang **Quản trị** của web → dán token vào ô → **Lưu token** → **Kết nối**.
   Thấy badge `● Đã kết nối: <tên bạn>` là thành công.

> Cách khác — *Classic token*: https://github.com/settings/tokens → Generate new token (classic) → tích scope **`repo`**.

**Đăng bài:** điền tiêu đề, năm, khu vực, thẻ, ảnh bìa, tóm tắt, nội dung (có thanh công cụ Markdown) → **Xem trước** → **Xuất bản lên repo**. Site tự deploy lại sau ít phút.

> ⚠️ Token là chìa khoá ghi vào repo — **không chia sẻ, không commit vào code**. Trang admin chỉ lưu token trong `localStorage` của trình duyệt bạn và chỉ gọi tới `api.github.com`. Nếu lỡ lộ, vào lại trang tokens ở trên và **Revoke**.

## 🔔 Bật bình luận (Giscus — tuỳ chọn)

1. Bật **Discussions** cho repo: Settings → General → Features → tích **Discussions**.
2. Cài app Giscus: https://github.com/apps/giscus → cấp cho repo `historyweb`.
3. Vào https://giscus.app, nhập repo → sao chép **`data-repo-id`** và **`data-category-id`**.
4. Điền vào `config.js` → `comments`: đặt `enabled: true`, dán `repoId`, `categoryId`.

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
