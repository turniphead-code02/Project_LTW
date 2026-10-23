# BỘ QUY ƯỚC XÂY DỰNG PORTFOLIO CÁ NHÂN
# DỰ ÁN: LẬP TRÌNH WEB (PROJECT_LTW)
**Tài liệu áp dụng:** Toàn bộ thành viên nhóm  
**Mục tiêu:** Đồng bộ cấu trúc, độc lập mã nguồn, chống xung đột Git (Merge Conflict), sẵn sàng triển khai GitHub Pages/Vercel.

---

## 1. TẠI SAO BẮT BUỘC PHẢI CÓ QUY ƯỚC CHO BÀI TẬP PORTFOLIO?

Dù portfolio mang tính cá nhân, nhưng khi gom chung vào cùng một Git Repository của nhóm, nếu không có quy ước rõ ràng từ đầu sẽ lập tức dẫn đến **4 thảm họa kỹ thuật thực tế**:
1. **Xung đột tệp gốc (Root Collision):** Thành viên nào cũng tạo `index.html`, `style.css`, `script.js` ngay thư mục gốc $\rightarrow$ ghi đè mã nguồn của nhau khi merge Git.
2. **Gãy đường dẫn tài nguyên (Asset Path Breakage):** Dùng đường dẫn tuyệt đối dạng `/assets/avatar.png` khiến hình ảnh và CSS bị lỗi 404 khi triển khai lên GitHub Pages (do GitHub Pages chạy trên sub-path `/<tên-repo>/`).
3. **Giảng viên không chấm được bài:** Vào trang chủ repo chỉ thấy portfolio của một người, không có cơ chế điều hướng xem các thành viên còn lại.
4. **Trang ngõ cụt (Dead-End):** Người xem vào portfolio của một thành viên nhưng không có cách nào bấm quay lại trang danh sách nhóm.

---

## 2. QUY CHUẨN CẤU TRÚC THƯ MỤC DỰ ÁN (ISOLATED DIRECTORY PATTERN)

Mỗi thành viên được cấp một **không gian độc lập tuyệt đối** nằm trong thư mục `portfolios/`. 

```text
Project_LTW/
├── .gitignore                          <-- Chặn file rác hệ điều hành & editor
├── DacTaKyThuatJOB_PORTAL.md           <-- Tài liệu đặc tả hệ thống
├── PhanCongViec.md                     <-- Kế hoạch phân công công việc
├── QuyUocPortfolio.md                  <-- Tài liệu quy ước này
├── index.html                          <-- TRANG CHỦ NHÓM (Team Hub / Member Directory)
├── css/
│   └── hub.css                         <-- CSS riêng cho trang chủ nhóm
└── portfolios/
    ├── <MSSV>_<kebab-case-ten>/        <-- Thư mục cá nhân của thành viên
    │   ├── index.html                  <-- Portfolio chính của cá nhân
    │   ├── css/
    │   │   └── style.css               <-- CSS riêng biệt, scoped hoàn toàn
    │   ├── js/
    │   │   └── main.js                 <-- JS riêng biệt
    │   └── assets/                     <-- Ảnh cá nhân, icon, file CV
    │       ├── avatar.webp
    │       └── cv.pdf
    └── 2110123_nguyen-van-a/           <-- Ví dụ thư mục của bạn Nguyễn Văn A
        ├── index.html
        ├── css/
        ├── js/
        └── assets/
```

### Quy tắc đặt tên thư mục cá nhân:
* Cú pháp bắt buộc: `portfolios/<MSSV>_<ten-khong-dau-kebab-case>`
* *Ví dụ hợp lệ:* 
  * `portfolios/2210001_tran-sinh/`
  * `portfolios/2210002_nguyen-van-an/`
* *Cấm:* Đặt tên có dấu, khoảng trắng, hoặc tên chung chung như `my-portfolio/`, `profile/`, `member1/`.

---

## 3. QUY ĐỊNH KỸ THUẬT & TIÊU CHUẨN ĐÁNH GIÁ (TECHNICAL STANDARDS)

### 3.1. Tiêu chuẩn HTML5 Ngữ nghĩa (Semantic HTML)
Đây là tiêu chí cốt lõi trong môn Lập Trình Web để lấy điểm tối đa:
* **Bắt buộc cấu trúc phân đoạn rõ ràng:**
  * `<header>`: Chứa Logo/Tên cá nhân và menu điều hướng `<nav>`.
  * `<main>`: Khu vực nội dung chính của trang.
  * `<section>`: Từng khối nội dung (Giới thiệu, Kỹ năng, Dự án, Học vấn).
  * `<article>`: Từng thẻ dự án / bài viết độc lập.
  * `<footer>`: Thông tin bản quyền, liên kết mạng xã hội, nút quay lại.
* **Cấm lạm dụng thẻ `<div>` (Anti Div-Soup):** Không dùng `<div>` cho các thành phần đã có thẻ HTML5 ngữ nghĩa tương ứng.
* Thẻ `<html>` phải có thuộc tính `lang="vi"` (hoặc `lang="en"`).
* Thẻ `<head>` phải có đầy đủ: `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, `<title>` rõ ràng chứa Tên & MSSV.

### 3.2. Quy chuẩn Đường dẫn Tương đối (Relative Paths)
* **BẮT BUỘC dùng đường dẫn tương đối `./` hoặc `../`:**
  * Đúng: `<link rel="stylesheet" href="./css/style.css">`
  * Đúng: `<img src="./assets/avatar.webp" alt="Ảnh chân dung Trần Sinh">`
  * Sai: `<link rel="stylesheet" href="/css/style.css">` (Lập tức gãy khi deploy lên GitHub Pages).
* Tuyệt đối không tham chiếu ra ngoài thư mục cá nhân của mình (trừ liên kết quay lại trang chủ nhóm `../../index.html`).

### 3.3. Quy chuẩn CSS & Độc lập Giao diện (Scoped Styles)
* Toàn bộ CSS cá nhân phải nằm trong thư mục cá nhân.
* **Cấm viết CSS đè lên thẻ gốc toàn cục mà không có scope:** Khuyến khích bọc toàn bộ nội dung body của bạn vào một wrapper class mang tên mình hoặc CSS namespace (ví dụ: `.portfolio-wrapper { ... }`).
* Hỗ trợ thiết kế **Mobile-First**:
  * Giao diện phải tương thích từ màn hình nhỏ nhất ($375\text{px}$) đến màn hình Desktop ($1440\text{px}$).
  * Sử dụng Flexbox / CSS Grid hiện đại, không dùng `table` để dàn trang.
* Nút bấm và vùng chạm cảm ứng: Kích thước tối thiểu **$44 \times 44 \text{ px}$**.

### 3.4. Chuẩn tiếp cận & Tối ưu hóa (a11y & Performance)
* **Accessibility (WCAG 2.1 AA):**
  * Tỷ lệ tương phản chữ và nền tối thiểu **$4.5:1$**.
  * 100% thẻ `<img>` bắt buộc có thuộc tính `alt` mô tả có nghĩa.
  * Các nút icon (Facebook, GitHub, LinkedIn, DarkMode) bắt buộc có `aria-label="Liên kết đến GitHub cá nhân"`.
* **Tối ưu hình ảnh:** Nén ảnh avatar/dự án dưới $200\text{KB}$, ưu tiên định dạng hiện đại (`.webp` hoặc `.svg`).

---

## 4. NỘI DUNG TỐI THIỂU BẮT BUỘC CÓ TRONG PORTFOLIO

Để đảm bảo đáp ứng chuẩn đề cương môn học và thể hiện năng lực chuyên nghiệp, portfolio của mỗi cá nhân bắt buộc có đủ 6 phần:

```text
[ 1. Header / Navigation ] ➔ [ 2. Hero Section (Giới thiệu & Avatar) ]
         ➔ [ 3. Kỹ năng (Tech Stack) ] ➔ [ 4. Dự án & Đóng góp trong LTW ]
         ➔ [ 5. Thông tin liên hệ ] ➔ [ 6. Footer (Link về Trang chủ nhóm) ]
```

1. **Hero Section:**
   * Họ và tên đầy đủ, MSSV, Lớp sinh hoạt / Khoa.
   * Vị trí mong muốn / Vai trò đảm nhiệm trong dự án Job Portal (ví dụ: *Frontend Developer / Data Architect*).
   * Ảnh đại diện chân dung chuyên nghiệp.
   * Câu bio ngắn gọn (mục tiêu nghề nghiệp, sở thích công nghệ).
2. **Kỹ năng (Skills):**
   * Ngôn ngữ: HTML5, CSS3, JavaScript/TypeScript, SQL,...
   * Công cụ: Git/GitHub, Figma, VS Code, Postman,...
3. **Dự án / Kinh nghiệm (Projects):**
   * Mô tả ít nhất 1-2 bài tập hoặc dự án đã từng làm (kèm công nghệ sử dụng và link demo/source code nếu có).
   * Vai trò phân công trong dự án Job Portal sắp tới.
4. **Học vấn & Chứng chỉ (Education - tùy chọn nâng cao):** Quá trình học tập tại trường.
5. **Thông tin liên hệ (Contact):** Email, liên kết GitHub, LinkedIn.
6. **Điều hướng nhóm (Chống trang ngõ cụt - Zero Dead-End):**
   * Luôn có nút ghim hoặc liên kết ở Header/Footer: `[← Quay lại Danh sách Nhóm]` trỏ đến `../../index.html`.

---

## 5. QUY ƯỚC PHỐI HỢP GIT & TRANG CHỦ NHÓM (HUB PAGE)

### 5.1. Trang chủ điều hướng của nhóm (`/index.html` tại Root)
* Người phụ trách (Trưởng nhóm hoặc ROLE-1) sẽ dựng một trang Portal chung đơn giản:
  * Hiển thị: Tên nhóm, Tên đề tài môn học (*Cổng thông tin việc làm - Job Portal*).
  * Danh sách các thành viên dạng lưới Card: Mỗi Card có ảnh đại diện, họ tên, MSSV, vai trò và nút bấm `[Xem Portfolio]` dẫn vào `portfolios/<thư-mục-cá-nhân>/index.html`.

### 5.2. Quy trình làm việc với Git
1. Kéo mã nguồn mới nhất từ nhánh chính:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Tạo nhánh riêng theo định dạng chuẩn:
   ```bash
   git checkout -b feature/portfolio-<mssv>-<ten>
   # Ví dụ: git checkout -b feature/portfolio-2210001-sinh
   ```
3. Tạo thư mục của mình trong `portfolios/` và tiến hành viết code.
4. **Chỉ commit những tệp trong thư mục của chính mình:**
   ```bash
   git add portfolios/2210001_tran-sinh/
   git commit -m "feat: hoan thanh portfolio ca nhan cho Tran Sinh (MSSV: 2210001)"
   git push origin feature/portfolio-2210001-sinh
   ```
5. Mở Pull Request vào nhánh `main` và thông báo cho nhóm review.
6. **Cập nhật link trên trang chủ nhóm:** Thành viên thêm 1 thẻ Card của mình vào `index.html` gốc hoặc trưởng nhóm tổng hợp khi merge PR.

---

## 6. CHECKLIST TỰ NGHIỆM THU TRƯỚC KHI TẠO PULL REQUEST (DoD)

Trước khi gửi link cho nhóm review, từng thành viên tự tích đủ 6 tiêu chí:

- [ ] 1. Thư mục cá nhân đặt đúng quy tắc: `portfolios/<MSSV>_<ten-kebab-case>/`.
- [ ] 2. Tất cả đường dẫn ảnh/CSS/JS đều dùng relative path `./` hoặc `../` (đã test mở trực tiếp file `index.html` bằng trình duyệt vẫn chạy mượt, không lỗi 404).
- [ ] 3. Kiểm tra bằng trình duyệt (F12): Giao diện co giãn chuẩn trên cả màn hình điện thoại ($375\text{px}$) và máy tính ($1440\text{px}$), không bị vỡ bố cục, không bị thanh cuộn ngang khó chịu.
- [ ] 4. Đạt chuẩn Semantic HTML: Đủ `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`; 100% ảnh có thẻ `alt`.
- [ ] 5. Có nút `[Quay lại Trang chủ Nhóm]` trỏ về `../../index.html` hoạt động chính xác.
- [ ] 6. Console trình duyệt (F12) không có bất kỳ dòng báo lỗi đỏ nào.
