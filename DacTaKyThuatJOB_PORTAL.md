# TÀI LIỆU ĐẶC TẢ KỸ THUẬT & TIÊU CHUẨN KỸ NGHỆ WEB
# DỰ ÁN: CỔNG THÔNG TIN VIỆC LÀM (JOB PORTAL)
**Phiên bản:** 2.0.0-PROD |  
**Tiêu chuẩn áp dụng:** Modern Web Engineering Standard & Web Content Accessibility Guidelines (WCAG 2.1 AA)

---

## 1. BỐI CẢNH, MỤC TIÊU & RANH GIỚI PHẠM VI (CONTEXT & SCOPE)

### 1.1. Mục tiêu hệ thống
Xây dựng nền tảng tuyển dụng trực tuyến kết nối ba nhóm đối tượng trọng yếu:
* **Ứng viên (Candidate):** Tìm kiếm việc làm, quản lý hồ sơ, nộp đơn ứng tuyển an toàn và theo dõi vòng đời đơn ứng tuyển.
* **Nhà tuyển dụng (Employer):** Quản lý hồ sơ công ty, đăng tin và kiểm duyệt tin tuyển dụng, tiếp nhận và sàng lọc hồ sơ ứng viên.
* **Quản trị viên (Admin):** Giám sát tính toàn vẹn của nền tảng, duyệt tài khoản doanh nghiệp, kiểm duyệt bài đăng và quản trị tài nguyên.

### 1.2. Ranh giới phạm vi (Scope Boundaries)
* **Trong phạm vi (In-Scope):**
  * Xác thực người dùng đa vai trò (RBAC) với cơ chế bảo mật phiên chống XSS/CSRF.
  * Công cụ tìm kiếm & lọc việc làm đa tiêu chí kết hợp phân trang hiệu năng cao (Full-Text Search).
  * Tải lên và thẩm tra tệp CV định dạng PDF an toàn (kiểm tra MIME nhị phân và Magic Bytes `%PDF-`).
  * Quản lý vòng đời đơn ứng tuyển theo mô hình **Bản chụp bất biến (Immutable Snapshot)**.
  * Xử lý thông báo email nghiệp vụ (Transactional Email) chạy nền qua hàng đợi bất đồng bộ (Message Queue / Background Worker).
  * Giao diện Mobile-First, tuân thủ chuẩn ngữ nghĩa HTML5 và chuẩn tiếp cận WCAG 2.1 AA.
* **Ngoài phạm vi (Out-of-Scope):**
  * Không tích hợp cổng thanh toán trừ tiền trực tuyến (mô phỏng đăng tin miễn phí).
  * Không gọi API xác thực mã số thuế của Tổng cục Thuế (duyệt thủ công ở cấp Admin).
  * Không xây dựng hội nghị truyền hình / video call thời gian thực (xếp lịch phỏng vấn và gửi liên kết phòng họp qua email).

---

## 2. KIẾN TRÚC HỆ THỐNG, HẠ TẦNG & BẢO MẬT MẠNG (ARCHITECTURE & NETWORKING)

### 2.1. Mô hình kiến trúc tổng thể (Decoupled Layered Architecture)

```text
[ Client Layer: Desktop Web & Mobile Web (SPA / PWA) ]
                         │
                         ▼ HTTPS (Port 443 / TLS 1.3 - HTTP/2 / HTTP/3)
[ Edge / Reverse Proxy Layer (Nginx / Cloudflare Edge Gateway) ]
  ├── SSL/TLS Termination
  ├── DDoS Shield & WAF
  ├── Rate Limiting (IP & Route based)
  └── Static Asset Caching
                         │
                         ▼ Reverse Proxy (Internal Network)
[ Backend Core API Service (Node.js + TypeScript / Express) ]
  ├── Global Error Handler & JSON Envelope
  ├── RBAC & Auth Guard (HttpOnly Cookie + JWT)
  └── Upload Validator (Magic Bytes Inspector)
         │                         │                         │
         ▼                         ▼                         ▼
[ Relational Database ]   [ Message Queue / Cache ]  [ Cloud Object Storage ]
  PostgreSQL 15+ (3NF)        Redis 7+ (BullMQ)       S3 / Cloudflare R2
  (Full-Text Search GIN)   (Async Email Worker)     (Presigned URL for PII)
```

### 2.2. Quy chuẩn mạng, cổng dịch vụ & Tiêu đề bảo mật
* **Cổng dịch vụ (Ports):**
  * **Port 80 (HTTP):** Tự động chuyển hướng vĩnh viễn (`HTTP 301 Permanent Redirect`) sang Port 443 (HTTPS). Tuyệt đối không phục vụ nội dung qua HTTP.
  * **Port 443 (HTTPS):** Cổng chính thức phục vụ toàn bộ lưu lượng Production. Bắt buộc TLS 1.2 hoặc TLS 1.3.
  * **Cổng nội bộ môi trường Dev:** Frontend (`3000`/`5173`), Backend (`5000`), PostgreSQL (`5432`), Redis (`6379`).
* **Tiêu đề bảo mật bắt buộc (Security Headers):**
  ```http
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline';
  ```
* **Chính sách CORS & Giới hạn tần suất (CORS & Rate Limiting):**
  * `Access-Control-Allow-Origin`: Chỉ cho phép domain của Frontend (không dùng wildcard `*` trên các route nhận cookie).
  * Rate Limit API Công khai: Tối đa 60 requests/phút/IP.
  * Rate Limit API Xác thực (`/auth/login`, `/auth/register`): Tối đa 5 requests/phút/IP để chống brute-force.

### 2.3. Quy chuẩn định dạng URL (URL & Slug Standards)
* Định dạng: `kebab-case`, chữ thường hoàn toàn, không dấu tiếng Việt, không khoảng trắng, không ký tự đặc biệt, không để lộ phần mở rộng tệp (`.php`, `.html`, `.aspx`).
* **Đảm bảo tính duy nhất (Uniqueness Rule):** Đối với các tài nguyên có thể trùng tên (như tiêu đề việc làm), slug bắt buộc phải đi kèm hậu tố UUID rút gọn hoặc mã định danh để đảm bảo tính duy nhất tuyệt đối.
  * *Chi tiết việc làm:* `/viec-lam/ky-su-backend-node-js-a8f12d`
  * *Trang công ty:* `/cong-ty/fpt-software`
  * *API Endpoint:* `/api/v1/jobs/:id/apply`

---

## 3. THIẾT KẾ CƠ SỞ DỮ LIỆU CHUẨN HÓA (DATABASE SCHEMA - 3NF)

> **Cải tiến kỹ thuật trọng yếu:**
> 1. Dùng **UUID** làm khóa chính thay cho số tự tăng `SERIAL` để triệt tiêu lỗ hổng IDOR và ngăn chặn đối thủ crawl dữ liệu kinh doanh.
> 2. Đơn ứng tuyển (`applications`) lưu **Bản chụp bất biến (Snapshot)** của CV để bảo toàn tính toàn vẹn lịch sử tuyển dụng.
> 3. Tích hợp chỉ mục **Full-Text Search (GIN)** trên PostgreSQL để xử lý tìm kiếm việc làm tốc độ cao.
> 4. Ràng buộc `UNIQUE` trên slug bài đăng và hỗ trợ cờ "Lương thỏa thuận".

## 4. HỢP ĐỒNG API CHUẨN HÓA & PHÂN HỆ NGHIỆP VỤ (API CONTRACT SPECIFICATIONS)

### 4.1. Cấu trúc đóng gói dữ liệu (JSON Envelope Standard)
Mọi phản hồi từ REST API bắt buộc tuân theo định dạng đồng nhất:

```json
{
  "success": true,
  "code": 200,
  "message": "Thông điệp mô tả kết quả xử lý",
  "data": {},
  "errors": null,
  "meta": {
    "page": 1,
    "pageSize": 12,
    "total": 85
  }
}
```

*Khi có lỗi (Client Error 4xx hoặc Server Error 5xx):*
```json
{
  "success": false,
  "code": 400,
  "message": "Dữ liệu gửi lên không hợp lệ",
  "data": null,
  "errors": [
    { "field": "email", "message": "Email không đúng định dạng" }
  ],
  "meta": null
}
```

### 4.2. Chiến lược Xác thực & Quản lý Phiên (Authentication & Token Strategy)
* **Access Token:** Định dạng JWT, thời hạn ngắn (**15 phút**). Trả về trong payload đăng nhập và được client lưu trong bộ nhớ tạm (In-Memory State). Gửi kèm request qua tiêu đề: `Authorization: Bearer <token>`.
* **Refresh Token:** Thời hạn dài (**7 ngày**). Được Backend set trực tiếp vào Cookie với cờ bảo mật bắt buộc: `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`. Tuyệt đối không để JavaScript đọc được token này (chống hoàn toàn XSS đánh cắp phiên).
* **Cơ chế Silent Refresh:** Khi Access Token hết hạn (nhận mã 401), Frontend tự động gọi `POST /api/v1/auth/refresh` bằng Cookie sẵn có để lấy Access Token mới mà không làm ngắt quãng trải nghiệm người dùng.

### 4.3. Danh mục API Endpoints cốt lõi

#### Phân hệ 1: Xác thực & Tài khoản (`/api/v1/auth`)
* `POST /api/v1/auth/register`: Đăng ký tài khoản mới (Body: `email`, `password`, `role`).
* `POST /api/v1/auth/login`: Xác thực tài khoản, cấp Access Token & set HttpOnly Refresh Cookie.
* `POST /api/v1/auth/refresh`: Cấp mới Access Token thông qua Refresh Token trong Cookie.
* `POST /api/v1/auth/logout`: Xóa Refresh Token trong Cookie và hủy phiên làm việc.
* `GET /api/v1/auth/me`: Lấy thông tin tài khoản hiện tại kèm profile chi tiết.

#### Phân hệ 2: Tin tuyển dụng (`/api/v1/jobs`)
* `GET /api/v1/jobs`: Tìm kiếm và lọc tin tuyển dụng công khai.
  * **Query Params:**
    * `keyword`: Từ khóa tìm kiếm (tiêu đề, kỹ năng).
    * `category_id`: Lọc theo ngành nghề (UUID).
    * `location_id`: Lọc theo địa điểm (UUID).
    * `salary_min`, `salary_max`: Khoảng lương mong muốn.
    * `is_negotiable`: `true`/`false` (bao gồm cả việc thỏa thuận).
    * `page` (default: 1), `pageSize` (default: 12).
  * **Cơ chế lọc tự động (Lazy Expiry):** API chỉ trả về các bài đăng thỏa mãn:
    `status = 'approved' AND deadline >= CURRENT_DATE`
* `GET /api/v1/jobs/:slug`: Xem thông tin chi tiết một công việc.
* `POST /api/v1/jobs`: Nhà tuyển dụng tạo tin mới (Yêu cầu quyền `employer`, trạng thái mặc định: `pending`).
* `PUT /api/v1/jobs/:id`: Nhà tuyển dụng chỉnh sửa tin (Kiểm tra quyền sở hữu tài nguyên: `job.employer_id === current_user.employer_id`).
* `PATCH /api/v1/jobs/:id/status`: Quản trị viên duyệt/từ chối tin tuyển dụng (`admin`), hoặc Employer đóng tin (`closed`).

#### Phân hệ 3: Tải tệp CV & Ứng tuyển (`/api/v1/resumes` & `/api/v1/applications`)
* `POST /api/v1/resumes/upload`:
  * Tải lên tệp CV cá nhân (`multipart/form-data`).
  * Thực hiện kiểm tra định dạng PDF, Magic Bytes, kích thước $\le 5\text{MB}$.
  * Trả về thông tin tệp và URL tạm thời.
* `POST /api/v1/jobs/:id/apply`:
  * Nộp đơn ứng tuyển cho công việc.
  * **Body:** `{ "resumeId": "uuid...", "coverLetter": "..." }`
  * Hệ thống tự động sao chép CV thành bản chụp snapshot bất biến lưu vào `applications.snapshot_resume_url`.
  * Trả về lỗi `400 Bad Request` nếu đã nộp đơn trước đó (nhờ ràng buộc `unique_candidate_job`).
* `GET /api/v1/employer/applications`: Nhà tuyển dụng xem danh sách ứng viên nộp vào các bài đăng của mình.
* `GET /api/v1/candidate/applications`: Ứng viên theo dõi lịch sử ứng tuyển và trạng thái hồ sơ.
* `PATCH /api/v1/applications/:id/status`:
  * Nhà tuyển dụng chuyển trạng thái hồ sơ (`viewed`, `interview_scheduled`, `accepted`, `rejected`).
  * Tự động đẩy sự kiện vào Message Queue để gửi Transactional Email.

---

## 5. BẢO MẬT, TẢI TỆP AN TOÀN & XỬ LÝ BẤT ĐỒNG BỘ (SECURITY & ASYNC WORKER)

### 5.1. Thẩm định tệp tải lên chống RCE (Remote Code Execution)
Để ngăn chặn hoàn toàn việc hacker tải lên mã độc thực thi (PHP web shell, file nhị phân giả mạo):
1. **Kiểm tra phần mở rộng:** Chỉ chấp nhận `.pdf`.
2. **Kiểm tra Content-Type:** Header phải là `application/pdf`.
3. **Kiểm tra Magic Bytes nhị phân (Binary Header Signature):** Đọc 5 bytes đầu tiên của tệp đệm (Buffer). Bắt buộc phải khớp chính xác với chuỗi `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`).
4. **Cô lập lưu trữ:**
   * Tệp đổi tên ngẫu nhiên theo chuẩn `uuid_v4().pdf`.
   * Tệp lưu trữ trên Cloud Object Storage (S3 / R2), không đặt trong thư mục public của Web Server.
5. **Bảo vệ dữ liệu định danh cá nhân (PII Compliance):**
   * Không cấp public link cho tệp CV.
   * Khi Nhà tuyển dụng hoặc Ứng viên xem CV, Backend sinh **Presigned URL** có thời hạn tối đa **15 phút**. Hết 15 phút liên kết tự hủy.

### 5.2. Kiến trúc xử lý Hàng đợi Email (Asynchronous Message Queue)
Tuyệt đối không gửi email đồng bộ trong luồng xử lý HTTP request để tránh nghẽn CPU và rủi ro timeout khi dịch vụ SMTP bên thứ ba bị trễ.

```text
[ Client (HR cập nhật trạng thái) ]
                 │
                 ▼ PATCH /api/v1/applications/:id/status
[ API Server: Node.js Express ]
  ├── 1. Cập nhật trạng thái trong Database
  ├── 2. Đẩy Job vào Redis Queue: bullmq.add('EMAIL_STATUS_CHANGE', payload)  (< 5ms)
  └── 3. Phản hồi HTTP 200 OK ngay lập tức cho HR (< 50ms)
                 │
                 ▼ (Chạy ngầm ở tiến trình Worker độc lập)
[ Background Email Worker ]
  ├── Nhận Job từ Redis
  ├── Gọi dịch vụ Transactional Email (Resend / Amazon SES / Nodemailer)
  └── Tự động Retry 3 lần (Exponential Backoff) nếu mạng gặp sự cố
```

---

## 6. QUY ƯỚC GIAO DIỆN, TRẢI NGHIỆM NGƯỜI DÙNG & TIẾP CẬN (UI/UX & ACCESSIBILITY)

### 6.1. Bố cục thích ứng theo ngữ cảnh (Adaptive Layouts)
* **Khu vực công khai (Public Portal - Tìm việc, Chi tiết việc làm):**
  `Header (Logo, Danh mục, Ô tìm kiếm nhanh, Auth Actions) ➔ Hero / Main Content ➔ Sticky/Standard Footer (Liên hệ, Sitemap, Bản quyền)`
* **Khu vực quản trị (Dashboard - Nhà tuyển dụng & Admin):**
  `Collapsible Sidebar (Bên trái) ➔ Top Control Bar (Search, Thông báo, Avatar) ➔ Dynamic Data Grid (Nội dung cuộn độc lập)` *(Loại bỏ hoàn toàn Footer truyền thống để tối đa hóa không gian thao tác).*

### 6.2. Tư duy Mobile-First & Điểm ngắt (Breakpoints)
* **Mobile (< 640px):**
  * Thanh điều hướng chuyển thành Hamburger Menu hoặc Bottom Tab Bar.
  * Bộ lọc tìm kiếm thu gọn vào **Slide-over Drawer / Bottom Sheet**.
  * Nút "Ứng tuyển ngay" trên trang chi tiết được ghim cố định ở cạnh dưới màn hình (**Sticky Bottom Bar**).
* **Tablet (640px - 1023px):** Danh sách việc làm hiển thị dạng lưới 2 cột.
* **Desktop (≥ 1024px):** Bố cục 2 phần: Bộ lọc cố định bên trái (Sticky Sidebar), Danh sách việc làm 3 cột bên phải. Container tối đa từ `1200px` đến `1440px`.
* **Vùng tương tác cảm ứng (Touch Targets):** Mọi nút bấm, icon và ô chọn trên thiết bị di động tối thiểu đạt kích thước **$44 \times 44 \text{ px}$**, khoảng cách đệm tối thiểu $8\text{px}$.

### 6.3. Tiêu chuẩn Khả năng Tiếp cận (WCAG 2.1 AA)
* **Độ tương phản màu sắc (Color Contrast):** Đạt tỷ lệ tối thiểu **$4.5:1$** cho văn bản thường và **$3:1$** cho văn bản cỡ lớn ($>18\text{pt}$) hoặc các nút điều khiển.
* **Hỗ trợ Screen Reader:**
  * Toàn bộ thẻ `<img>` bắt buộc có thuộc tính `alt` mô tả nội dung (hoặc `alt=""` nếu là ảnh trang trí).
  * Mọi nút bấm chỉ dùng icon (Close modal, Search icon) bắt buộc có thuộc tính `aria-label` (ví dụ: `aria-label="Đóng cửa sổ"`).
* **Điều hướng bàn phím (Keyboard Navigation):** Giữ nguyên viền con trỏ phím hoặc cung cấp style `:focus-visible` tương phản cao khi người dùng duyệt web bằng phím `Tab`.

### 6.4. Tối ưu Hiệu năng Web (Core Web Vitals) & Phản hồi UX
* **Chỉ số hiệu năng:**
  * **LCP (Largest Contentful Paint):** Tải phần tử lớn nhất $< 2.5\text{s}$.
  * **INP (Interaction to Next Paint):** Độ trễ tương tác người dùng $< 200\text{ms}$.
  * **CLS (Cumulative Layout Shift):** Độ xê dịch giao diện $< 0.1$ (chỉ định sẵn `width` và `height` cho ảnh).
  * Định dạng hình ảnh: Sử dụng **WebP/AVIF**, áp dụng `loading="lazy"` cho các ảnh phía dưới màn hình cuộn.
* **Triệt tiêu trang ngõ cụt (Zero Dead-Ends):**
  * Trang 404 thân thiện, tích hợp ô tìm kiếm và nút `[Quay về Trang chủ]`.
  * Khi nộp đơn ứng tuyển thành công, luôn hiển thị 2 lối điều hướng: `[Xem lịch sử ứng tuyển]` và `[Khám phá việc làm tương tự]`.
* **Phản hồi trạng thái (System Feedback):**
  * Hiển thị Skeleton Loading khi thời gian tải dữ liệu vượt quá $300\text{ms}$.
  * Thông báo Toast rõ ràng cho mọi hành động Submit form thành công hoặc thất bại.

---

## 7. MẪU DỰNG NGỮ CẢNH CHO CÔNG CỤ AI CODING (SPEC-DRIVEN PROMPT TEMPLATE)

Khi triển khai từng tính năng bằng các công cụ AI (Cursor, GitHub Copilot, Claude), sử dụng mẫu prompt sau để đảm bảo mã nguồn tuân thủ 100% tài liệu đặc tả này:

```text
Tôi đang phát triển dự án Cổng thông tin việc làm (Job Portal) bằng Node.js/TypeScript/React.
Hãy đọc kỹ file đặc tả: DAC_TA_KY_THUAT_JOB_PORTAL.md.

Yêu cầu thực hiện:
1. Viết mã nguồn cho tính năng: [Tên tính năng, ví dụ: Upload CV an toàn]
2. Tuân thủ nghiêm ngặt:
   - Sử dụng đúng cấu trúc bảng và kiểu dữ liệu UUID tại Mục 3.
   - Trả về phản hồi đúng cấu trúc JSON Envelope tại Mục 4.1.
   - Thẩm định Magic Bytes (%PDF-) và đổi tên file bằng UUID theo Mục 5.1.
   - Không sinh mã nguồn ngoài phạm vi đã quy định.
```

