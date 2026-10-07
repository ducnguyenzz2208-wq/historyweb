# Dòng Chảy Lịch Sử — Task cho AI

Cập nhật: 2026-10-08 (Asia/Taipei).
Repository: https://github.com/ducnguyenzz2208-wq/historyweb

## Quy trình thực hiện

1. Đọc file này, `progress.md`, hướng dẫn `AGENTS.md` nếu có và mã liên quan. Kiểm tra `git status` trước khi sửa; giữ nguyên thay đổi của người dùng.
2. Tiếp tục task đang làm hoặc task chưa hoàn thành đầu tiên theo thứ tự. Mỗi lượt chỉ triển khai một task, trừ khi người dùng yêu cầu khác.
3. Kiểm tra hiện trạng trước khi triển khai: checklist có thể cũ. Không đánh dấu xong chỉ vì đã có giao diện hoặc tên hàm.
4. Thực hiện đúng phạm vi; kiểm tra theo tiêu chí nghiệm thu. Ghi kết quả, giới hạn và trạng thái vào mục task tương ứng.
5. Chạy `npm run test:markdown`, `npm run check-links` và các kiểm tra phù hợp với thay đổi. Không xuất bản nội dung/ảnh chưa được đối chiếu nguồn.
6. Khi task đạt nghiệm thu, commit các file thuộc task và push lên `origin` theo nhánh đang được người dùng cho phép. Người dùng đã yêu cầu tự động upload thay đổi lên repo này sau khi thực hiện; không force-push hoặc ghi đè lịch sử. Nếu push bị từ chối, kiểm tra nguyên nhân và báo rõ, không đánh dấu đã upload.
7. Báo ngắn gọn kết quả, kiểm tra, commit và trạng thái push. Push thành công không đồng nghĩa deploy thành công; chỉ xác nhận deploy khi có bằng chứng.

Trạng thái: `TODO` / `IN_PROGRESS` / `DONE` / `BLOCKED`. `DONE` chỉ khi đạt tiêu chí; nếu cần người duyệt nguồn, ghi phần chờ duyệt.

## Task 01 — Bảo vệ bộ render Markdown (P0)

Trạng thái: DONE

- Mục tiêu: nội dung Markdown không tạo mã thực thi qua URL hoặc thuộc tính HTML; giữ link, ảnh, caption, code và footnote hoạt động.
- Phạm vi: `assets/js/md.js`, mục lục trong `post.js` / `figure.js`, kiểm tra hồi quy và CI. Preview admin dùng chung `mdToHtml` nên nhận cùng chính sách.
- Chỉ cho phép HTTP(S), đường dẫn tương đối và anchor; mailto cho link. Cho phép ảnh raster base64 để preview; chặn data HTML/SVG, blob, protocol-relative URL, ký tự điều khiển và backslash.
- Escape nội dung và thuộc tính. Bảo vệ code và HTML sinh ra khỏi các bước định dạng tiếp theo. Escape lại text của heading khi dựng mục lục.
- Nghiệm thu: các nhóm kiểm tra URL nguy hiểm, chèn thuộc tính, raw HTML, code, caption, footnote đều pass; toàn bộ Markdown hiện có render không lỗi; link nội bộ pass.
- Giới hạn: task này bảo vệ thân bài Markdown và mục lục; không thay thế việc audit toàn bộ trường metadata JSON hoặc quản lý token ở task 02.
- Kết quả: thêm bộ lọc URL và escape HTML dùng chung; bảo vệ code/link/ảnh khỏi bước định dạng; sửa mục lục sự kiện và nhân vật; thêm kiểm tra hồi quy vào CI.
- Kiểm tra: `npm run test:markdown` pass 9 nhóm, render 114 tệp Markdown; `npm run check-links` pass 10 trang gốc; kiểm tra cú pháp JS và `git diff --check` pass.
- Trình duyệt local: bài Như Nguyệt render đủ TOC, thân bài, footnote; preview admin chặn link javascript, giữ alt chứa dấu nháy dưới dạng văn bản và không tạo thuộc tính thử/mã thực thi. Định dạng chữ, code và link nguồn vẫn hoạt động.
- Upload: xem commit chứa mục nhật ký này trên GitHub; kết quả push được xác nhận trong báo cáo cuối lượt. Task tiếp theo: 02.

## Task 02 — Giảm rủi ro token GitHub (P0)

Trạng thái: TODO

- Mặc định giữ token trong phiên; chỉ lưu lâu dài khi người dùng chủ động chọn. Xử lý token cũ trong localStorage mà không tự xóa dữ liệu ngoài phạm vi.
- Thêm nút xóa token và hướng dẫn fine-grained token giới hạn đúng repo, quyền Contents cần thiết.
- Nghiệm thu: kết nối, xuất bản, xóa token hoạt động; không ghi token vào log, URL, repo; xác minh hành vi sau reload/đóng phiên.
- Không dùng token thật trong kiểm thử tự động; không xuất bản bài thử lên main nếu chưa được yêu cầu.

## Task 03 — Prerender đầy đủ bài viết (P0)

Trạng thái: TODO

- Sinh HTML chứa tiêu đề, thân bài, infobox, mục lục, nguồn tham khảo từ Markdown; bỏ redirect JS bắt buộc trong trang sinh sẵn.
- Đồng bộ URL tĩnh, liên kết nội bộ, canonical, sitemap và metadata; dùng lại bộ render an toàn thay vì tạo parser thứ hai.
- Nghiệm thu: tắt JS vẫn đọc được bài; mở URL trực tiếp hoạt động; build toàn bộ bài không lỗi; crawler nhận nội dung thật trong HTML. Chốt thiết kế URL VI/EN trước khi thay đổi toàn site.

## Task 04 — Rà soát nguồn và ảnh (P0)

Trạng thái: TODO

- Lập danh sách nguồn cho 31 sự kiện và 24 nhân vật hiện tại, cập nhật số lượng theo dữ liệu thực tế.
- Đối chiếu credit với từng ảnh; lưu tác giả, URL trang nguồn và giấy phép. Không suy ra quyền sử dụng chỉ từ tên miền hoặc dòng credit.
- Bổ sung nguồn cho nhận định quan trọng, số trang/đoạn khi có thể; xác định quy trình gắn nhãn verified. Đánh dấu nguồn chưa đối chiếu thay vì tự nhận đã kiểm chứng.
- Nghiệm thu: mọi mục có nguồn; mọi ảnh có hồ sơ nguồn/quyền sử dụng; nội dung cần con người duyệt được liệt kê rõ. Không bịa trích dẫn hay giấy phép.

## Task 05 — Đồng bộ tài liệu tiến độ (P1)

Trạng thái: TODO

- Đối chiếu `progress.md` và README với mã thực tế; sửa số lượng, breadcrumb, song ngữ, prerender, offline và phụ thuộc ngoài.
- Nghiệm thu: phân biệt đã hoàn thành / một phần / chưa làm; không còn checklist mâu thuẫn; có ngày cập nhật.

## Task 06 — Chuẩn hóa trang bài viết (P1)

Trạng thái: TODO

- Xử lý tiêu đề lặp trong thân bài; giảm hero trên màn hình nhỏ; trỏ lịch sử sửa đổi đến đúng file VI/EN đang đọc.
- Thay thông báo cấu hình Giscus công khai bằng nội dung dành cho độc giả; giữ đường góp ý hữu ích.
- Nghiệm thu: tiêu đề chính rõ ràng, nội dung không mất; lịch sử đúng tệp; UI desktop/mobile được kiểm tra.

## Task 07 — Hoàn thiện song ngữ (P1)

Trạng thái: TODO

- Kiểm tra từng đường dẫn VI/EN; phân biệt bản lưu và bản dịch runtime trước khi xác định mục thiếu. Rà soát tên riêng, thuật ngữ và nguồn sau dịch.
- Nghiệm thu: chuyển ngôn ngữ nạp đúng thân bài; trường hợp thiếu có fallback/thông báo; bản dịch máy chưa duyệt được ghi rõ.

## Task 08 — Sửa chế độ đọc offline (P1)

Trạng thái: TODO

- Cache danh sách và bài đã đọc, cập nhật khi online; có trạng thái chưa tải khi offline. Quản lý version cache và tránh nội dung cũ sau xuất bản.
- Nghiệm thu: mở bài online, ngắt mạng, reload vẫn đọc được; khi online nhận bản mới; bài chưa lưu không hiển thị như đã có dữ liệu.

## Task 09 — Mobile và khả năng tiếp cận (P1)

Trạng thái: TODO

- Kiểm tra menu, TOC, infobox, bản đồ, modal tra cứu ở 360/390/768px và desktop; focus, bàn phím, contrast, reduced motion.
- Nghiệm thu: không tràn ngang; các thao tác chính dùng được bằng bàn phím; modal đóng và trả focus; ghi lại viewport và lỗi đã sửa.

## Task 10 — Tối ưu ảnh và tốc độ (P2)

Trạng thái: TODO

- Đo trước khi tối ưu; ảnh đúng kích thước, WebP/AVIF phù hợp, width/height hoặc aspect-ratio; ưu tiên ảnh đầu trang; giảm font/hiệu ứng nặng.
- Nghiệm thu: báo cáo Lighthouse trước/sau trên trang chủ, bài và danh sách, nêu điều kiện đo; không hứa đạt 95 khi chưa đo; không làm giảm khả năng đọc.

## Task 11 — Mở rộng kiểm tra CI (P2)

Trạng thái: TODO

- Quét trang sinh sẵn, đường dẫn Markdown, slug trùng, bản dịch thiếu, metadata bắt buộc và cú pháp JS. Giữ kiểm tra Markdown của task 01.
- Nghiệm thu: CI chỉ rõ file/mục lỗi; mẫu dữ liệu không hợp lệ bị phát hiện trước deploy; dữ liệu hiện tại pass hoặc có danh sách lỗi cần sửa.

## Task 12 — Quy trình biên tập (P2)

Trạng thái: TODO

- Trang nguyên tắc chọn nguồn, ghi công ảnh, sửa sai, trách nhiệm biên soạn. Chuẩn bị bản nháp → duyệt → xuất bản và hồ sơ riêng nếu mở nhiều tác giả.
- Nghiệm thu: độc giả biết người chịu trách nhiệm/cách góp ý; người viết có hướng dẫn đóng góp; xác định phần tài liệu và phần hệ thống thực sự đã triển khai.

## Nhật ký thực hiện

- 2026-10-07: Tạo roadmap 12 task; bắt đầu task 01 theo yêu cầu người dùng.
- 2026-10-08: Task 01 đạt nghiệm thu, cập nhật trạng thái DONE; chuẩn bị commit và push origin/main. Các task 02–12 chưa triển khai.
