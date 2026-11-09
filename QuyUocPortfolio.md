# QUY ƯỚC LÀM PORTFOLIO CÁ NHÂN (NHẬP MÔN WEB)

Quy ước này chỉ có **3 nguyên tắc cơ bản** để bài tập của cả nhóm chạy mượt và không bị lỗi khi nộp bài:

---

## 1. MỖI NGƯỜI MỘT THƯ MỤC RIÊNG (Tránh đè file của nhau)
Tất cả code cá nhân để trong thư mục `portfolios/<MSSV>_<Tên>/`:

```text
Project_LTW/
├── index.html                   <-- Trang chung của nhóm (chứa link dẫn vào portfolio từng bạn)
└── portfolios/
    ├── 2210001_tran-sinh/       <-- Thư mục của bạn
    │   ├── index.html           <-- File web cá nhân
    │   ├── style.css            <-- File trang trí CSS
    │   ├── script.js           <-- (Tùy chọn) JS nếu có làm hiệu ứng
    │   └── assets/              <-- Ảnh thẻ, ảnh đại diện, CV
    └── 2210002_nguyen-van-a/    <-- Thư mục của bạn A
```

---

## 2. QUY TẮC ĐƯỜNG DẪN ẢNH & CSS (Rất quan trọng)
* **Luôn dùng `./` cho ảnh và CSS** (để mở máy nào cũng xem được, không bị gãy link):
  * **Đúng:** `<link rel="stylesheet" href="./style.css">`
  * **Đúng:** `<img src="./assets/avatar.jpg" alt="Ảnh của tôi">`
  * **Sai:** `<link rel="stylesheet" href="/style.css">` *(bị lỗi trắng trang hoặc mất ảnh khi up lên web)*.

---

## 3. NỘI DUNG TRANG PORTFOLIO CẦN CÓ GÌ?
Mỗi bạn tự do sáng tạo giao diện, chỉ cần đảm bảo có các thông tin cơ bản:
1. **Thông tin:** Họ tên, MSSV, lớp, ảnh đại diện.
2. **Kỹ năng:** Các môn/công nghệ bạn biết (HTML, CSS, JS, C++, Java, Figma,...).
3. **Mục tiêu / Sở thích:** 1-2 câu ngắn giới thiệu bản thân.
4. **Nút quay lại:** Ở đầu hoặc cuối trang có một nút bấm `[← Trang chủ nhóm]` dẫn về `../../index.html`.

---

## 4. CÁCH LÀM VIỆC VỚI GIT (4 BƯỚC ĐƠN GIẢN)
1. **Kéo code mới về:**
   ```bash
   git pull origin main
   ```
2. **Tạo nhánh của mình:**
   ```bash
   git checkout -b portfolio-<tên-bạn>
   ```
3. **Chỉ add thư mục của mình và lưu lại:**
   ```bash
   git add portfolios/<thư-mục-của-bạn>/
   git commit -m "hoan thanh portfolio cua <tên-bạn>"
   ```
4. **Đẩy lên GitHub:**
   ```bash
   git push origin portfolio-<tên-bạn>
   ```
*(Sau đó lên GitHub bấm nút "Compare & pull request" để trưởng nhóm gộp vào).*
