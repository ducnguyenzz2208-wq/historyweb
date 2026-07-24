# 📜 Dòng Chảy Lịch Sử — Tiến độ & Lộ trình

> Tài liệu này ghi lại **đã làm gì** và **cần làm gì** để đưa trang thành một
> **bách khoa lịch sử tra cứu được** (giống báo điện tử + Wikipedia), song ngữ Việt–Anh,
> chạy tĩnh trên GitHub Pages.

Cập nhật lần cuối: **2026-07-24** · Đã xong **Giai đoạn 1 → 4** + sửa lỗi ảnh/console.
Việc tiếp theo: **Giai đoạn 5 — đưa web ra công khai** (xem cuối tài liệu).

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

### Ảnh & độ bền giao diện (2026-07-24)
- [x] **Sửa lỗi ảnh vỡ + `Uncaught SyntaxError`**: ảnh dự phòng (SVG data-URI) chứa dấu nháy đơn — do `encodeURIComponent` **không** mã hoá `'` — làm hỏng cú pháp trong `onerror="…'…'"`. Nay mã hoá `'` → `%27` và dùng thuộc tính kép `"` bên trong SVG.
- [x] **Gỡ toàn bộ 14 `onerror` nội tuyến** → thay bằng **một listener uỷ quyền** (`data-fallback`, bắt ở pha capture). Không còn nhúng JS vào HTML.
- [x] **Gộp 7 bản sao hàm tạo ảnh dự phòng** rải rác ở 7 tệp thành **một hàm dùng chung** `window.hwPlaceholder()`.
- [x] **Chuỗi ảnh dự phòng thông minh**: ảnh vừa đăng (`assets/uploads/…`) nếu chưa deploy xong sẽ **tự lấy tạm từ GitHub raw** rồi mới đến ảnh SVG → ảnh hiện ngay, không còn 404 lúc chờ deploy.
- [x] **Nhận nhiều định dạng ảnh hơn**: JPG/JPEG/JFIF, PNG/APNG, WEBP, AVIF, GIF, SVG, BMP, ICO, TIFF, HEIC/HEIF — nhận diện theo **đuôi tệp *hoặc* MIME** (ảnh dán từ clipboard không có tên vẫn nhận), chuẩn hoá đuôi, giới hạn 20MB kèm thông báo lỗi rõ ràng.
- [x] **Nút nổi “Đăng bài”** (biểu tượng bút) ở **góc dưới bên phải** mọi trang → mở trang Quản trị (ẩn khi đang ở trang Quản trị).

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
- [x] **Biên soạn nhân vật trong admin**: trình soạn thảo hợp nhất, chọn **Loại = Sự kiện / Nhân vật**; đăng thẳng vào `figures/`.
- [x] **Phân loại sự kiện theo thời kỳ** (trường *Thời kỳ lịch sử*) + hiển thị trong infobox.
- [x] **Bộ chọn vị trí trên bản đồ** trong admin (nhấp bản đồ thật để lấy toạ độ khớp Atlas).
- [x] **Trang nhân vật đổi sang phong cách bách khoa** (mục lục + infobox + dòng dẫn giống trang sự kiện).
- [x] **Avatar góc header** mở trang cá nhân (đã gỡ mục "Trang cá nhân" khỏi thanh điều hướng).
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

## 📈 Web đang ở đâu & đi theo hướng nào

**Định vị hiện tại:** không còn là “blog lịch sử” — đây đã là một **bách khoa lịch sử tra cứu được**
(sự kiện + nhân vật + chủ đề + bản đồ + niên biểu), song ngữ, tự xuất bản, chạy tĩnh nên rẻ và nhanh.

**Xu hướng đang bám đúng (giữ tiếp):**
- *Tra cứu trước, đọc sau* — người dùng tới từ Google/tìm kiếm nội bộ, cần **infobox + mục lục + liên kết chéo**, không cần dòng thời gian tuyến tính.
- *Nội dung có nguồn* — nhãn “đã kiểm chứng”, lịch sử sửa đổi, trích dẫn APA/MLA/Chicago là thứ phân biệt với blog thường.
- *Trực quan hoá* — bản đồ theo toạ độ + niên biểu là lợi thế so với Wikipedia thuần chữ.
- *Nhẹ & bền* — zero-dependency, PWA đọc offline, ảnh có chuỗi dự phòng.

**Rủi ro cần xử lý trước khi mở công khai:**
| Rủi ro | Vì sao nghiêm trọng | Hướng xử lý |
|---|---|---|
| Nội dung mỏng (4 sự kiện, 7 nhân vật) | Người đọc vào rồi rời ngay; Google không đánh giá cao | Ưu tiên **số 1**: viết đủ 30–50 mục |
| Chưa có **chú thích nguồn `[^1]`** | Trang lịch sử không dẫn nguồn sẽ mất uy tín | Nâng cấp `md.js` (xem Giai đoạn 5) |
| SEO phụ thuộc JS | Trang render bằng JS, crawler có thể không thấy nội dung | Prerender/SSG lúc build |
| Ai cũng thấy trang Quản trị | Lộ đường vào, dễ bị dò | Ẩn `admin.html`, chỉ vào bằng đường dẫn riêng |

---

## 🚀 Giai đoạn 5 — Đưa web ra công khai (ưu tiên theo thứ tự)

### A. Bắt buộc trước khi public
1. **Nội dung tối thiểu**: ≥ 30 sự kiện + ≥ 20 nhân vật, mỗi bài có ảnh, toạ độ, thời kỳ, thẻ và **nguồn tham khảo**.
2. **Chú thích nguồn `[^1]`** trong `md.js` → tự đánh số + danh sách “Nguồn tham khảo” cuối bài (đây là thứ khiến trang *đáng tin*).
3. **Prerender cho SEO**: sinh HTML tĩnh cho mỗi `post/figure` lúc build (script Node đọc `index.json` → xuất `post/<slug>.html`), để Google index được nội dung thật.
4. **Bảo mật trang Quản trị**: bỏ link Quản trị khỏi menu công khai, thêm `noindex` (đã có), cân nhắc đổi tên tệp thành đường dẫn khó đoán.
5. **Kiểm tra bản quyền ảnh**: chỉ dùng ảnh Public Domain / CC (Wikimedia) hoặc ảnh tự chụp; ghi nguồn đầy đủ ở trang Tư liệu.

### B. Ngay sau khi public
6. **Tên miền riêng** (vd `dongchaylichsu.vn`) + HTTPS + chuyển hướng www.
7. **Google Search Console + Analytics** (hoặc Plausible/Umami cho nhẹ & tôn trọng quyền riêng tư), nộp `sitemap.xml`.
8. **Bật bình luận Giscus** để nhận góp ý nguồn từ người đọc.
9. **Trang “Giới thiệu & Nguyên tắc biên tập”**: nói rõ cách chọn nguồn, cách sửa sai → tăng E-E-A-T (tiêu chí Google đánh giá nội dung chuyên môn).

### C. Phát triển dài hạn
10. **Nhiều tác giả thật** + quy trình duyệt bài (Pull Request thay vì ghi thẳng `main`).
11. **Song ngữ cho thân bài** (`content.vi` + `content.en`) để tiếp cận người đọc quốc tế.
12. **Trang chuyên đề** (vd “Việt Nam thế kỷ 20”) gom nhiều bài thành tuyến đọc có dẫn dắt.
13. **Bộ lọc theo Thời kỳ** trên trang danh sách + breadcrumb & liên kết chéo tự động.
14. **Tối ưu ảnh WebP** + đạt Lighthouse ≥ 95 cả 4 mục.

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
