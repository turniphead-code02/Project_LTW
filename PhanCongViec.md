# KẾ HOẠCH PHÂN CHIA CÔNG VIỆC & QUY TRÌNH PHỐI HỢP
# DỰ ÁN: CỔNG THÔNG TIN VIỆC LÀM (JOB PORTAL)
**Tài liệu tham chiếu:** [DAC_TA_KY_THUAT_JOB_PORTAL.md]
**Phương pháp luận:** Spec-Driven Development & Agile Task Allocation  
**Trạng thái:** Sẵn sàng

---

## 1. NGUYÊN TẮC CỐT LÕI TRƯỚC KHI BẮT ĐẦU (GROUND RULES)

Để đảm bảo nhóm không bị xung đột mã nguồn (merge conflict), không bị phụ thuộc chéo (Frontend ngồi chờ Backend), cả nhóm phải tuân thủ nghiêm ngặt **3 nguyên tắc thép**:

1. **Nguyên tắc "Hợp đồng đi trước" (Contract-First):**
   * Mọi định dạng dữ liệu, tên trường (ví dụ: `company_name`, `salary_min`), cấu trúc JSON Envelope đã được chốt cứng tại file đặc tả.
   * Backend và Frontend phải dựa trên hợp đồng này để làm việc độc lập. Frontend dùng **Mock API** trong giai đoạn đầu, không cần chờ Backend hoàn thành mới dựng giao diện.
2. **Nguyên tắc "Khóa chặt Giai đoạn 0" (Foundation Lock):**
   * **Tuyệt đối không ai được bắt đầu code tính năng nghiệp vụ** (như tìm kiếm việc làm, nộp CV) khi Giai đoạn 0 (Setup dự án, Database Migration, Base Middleware, Layout Shell) chưa hoàn thành và chưa được merge vào nhánh `develop`.
3. **Nguyên tắc "Không trang ngõ cụt & Luôn có kiểm thử" (Quality First):**
   * Mỗi tính năng khi hoàn thành phải đạt đủ tiêu chuẩn nghiệm thu (**Definition of Done - DoD**), bao gồm cả xử lý lỗi biên (Edge Cases) và kiểm tra hiển thị trên thiết bị di động.

---

## 2. MA TRẬN PHÂN VAI TRÁCH NHIỆM (RACI MATRIX)

Dựa trên cấu trúc nhóm phát triển web hiện đại (áp dụng linh hoạt cho nhóm 3 – 5 thành viên):

| Mã vai trò | Tên vai trò | Trách nhiệm chính (Accountable) | Sản phẩm then chốt bàn giao |
| :---: | :--- | :--- | :--- |
| **ROLE-1** | **Tech Lead & Data Architect** | Thiết kế CSDL, quản trị nhánh Git, thiết lập cấu trúc mã nguồn chung, rà soát mã nguồn (Code Review), theo dõi tiến độ. | Database Migration, Seed Data, Base Config, Review PR. |
| **ROLE-2** | **Backend & Security Engineer** | Xây dựng API cốt lõi, Authentication (JWT/Cookie), RBAC, Module Upload an toàn (Magic Bytes), Tích hợp Redis Queue. | REST API Controllers, Upload Middleware, BullMQ Worker. |
| **ROLE-3** | **Frontend Engineer (Public & Candidate)** | Xây dựng toàn bộ giao diện công khai: Trang chủ, Bộ lọc việc làm, Trang chi tiết, Modal nộp CV, Trang lịch sử ứng tuyển. | Mobile-First UI, Responsive Filter, Candidate Portal, a11y. |
| **ROLE-4** | **Frontend Engineer (Dashboard Portals)** | Xây dựng khu vực quản trị: Dashboard Nhà tuyển dụng (Đăng tin, Xem ứng viên, Đổi trạng thái) & Dashboard Admin. | Data Tables, Sidebar Navigation, Chart thống kê, Admin Actions. |

> **Ghi chú điều chỉnh theo quy mô nhóm:**
> nhóm 5 người:** Bổ sung thêm 1 thành viên chuyên trách **QA / Testing & DevOps** (Viết Integration Test, Docker hóa, Cấu hình CI/CD và Google Lighthouse Audit).

---

## 3. LỘ TRÌNH TRIỂN KHAI 3 GIAI ĐOẠN (PROJECT MILESTONES)

```text
[ GIAI ĐOẠN 0: NỀN TẢNG & KHUNG XƯƠNG ] (Ngày 1 - Ngày 3)
  ├── 1. Khởi tạo Git Repo & Coding Convention
  ├── 2. Chạy Migration CSDL & Seed Data mẫu
  ├── 3. Dựng Base Middleware (JSON Envelope & Error Handler)
  └── 4. Dựng Base Layouts & Design Tokens (Tailwind)
                 │
                 ▼ (Nghiệm thu Giai đoạn 0 xong mới mở khóa Giai đoạn 1)
[ GIAI ĐOẠN 1: TRIỂN KHAI TÍNH NĂNG SONG SONG ] (Ngày 4 - Ngày 11)
  ├── Nhánh Backend: Auth Service ➔ Job CRUD & Search ➔ Upload CV & Apply
  └── Nhánh Frontend: Auth Form ➔ Public Job Search ➔ Apply Flow ➔ Dashboards
                 │
                 ▼
[ GIAI ĐOẠN 2: TÍCH HỢP HÀNG ĐỢI, KIỂM THỬ & TỐI ƯU ] (Ngày 12 - Ngày 15)
  ├── 1. Tích hợp Redis Queue gửi Transactional Email ngầm
  ├── 2. Rà soát an ninh (Magic Bytes, CSRF, XSS, IDOR, Presigned URL)
  ├── 3. Kiểm thử Responsive & Khả năng tiếp cận WCAG 2.1 AA
  └── 4. Đóng gói & Chuẩn bị kịch bản nghiệm thu (Demo Flow)
```

---

## 4. BẢNG PHÂN RÃ CÔNG VIỆC CHI TIẾT (WORK BREAKDOWN STRUCTURE - WBS)

### GÓI CÔNG VIỆC 1: HẠ TẦNG CỐT LÕI & NỀN TẢNG (CORE & INFRASTRUCTURE)
*Bắt buộc hoàn thành 100% trong Giai đoạn 0*

| Mã việc | Tên đầu việc | Nhiệm vụ cụ thể | Đầu vào / Phụ thuộc | Sản phẩm bàn giao | Người phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **WP-1.1** | Setup Kho mã nguồn & Chuẩn hóa Code | Khởi tạo repo Backend (Node.js/TS) và Frontend (React/Vite/Tailwind). Cấu hình ESLint, Prettier, `.env.example`, `.gitignore`. | Không | Repo hoạt động trên GitHub, lệnh `npm run lint` chạy sạch. | **ROLE-1** | Cả nhóm clone về chạy `npm install` và `npm run dev` không bị lỗi. |
| **WP-1.2** | Database Migrations & Seed Data | Viết script tạo toàn bộ 7 bảng theo Mục 3 của [DAC_TA_KY_THUAT_JOB_PORTAL.md] (UUID, FTS Trigger, Unique Slug). Viết script seed data mẫu. | WP-1.1 | File SQL/ORM migration và script `npm run db:seed`. | **ROLE-1** | Chạy 1 lệnh tạo đủ bảng, có sẵn 20 tin tuyển dụng, 5 công ty, 10 ứng viên. |
| **WP-1.3** | Base Middleware & Global Error | Viết middleware bọc JSON Envelope (`{success, code, data, errors, meta}`) và Global Error Handler chuẩn HTTP status code. | WP-1.1 | File `responseWrapper.ts`, `errorHandler.ts`. | **ROLE-2** | Mọi API thử nghiệm đều trả về đúng chuẩn JSON Envelope, không crash server. |
| **WP-1.4** | Base Layout Shell & Mock Server | Cấu hình Router, Breakpoints Tailwind (<640px, 640-1023px, ≥1024px); dựng khung Public Layout (Header/Footer) và Dashboard Layout (Sidebar). Thiết lập Mock API. | WP-1.1 | 2 Layout Component hoàn chỉnh, Mock API data mẫu. | **ROLE-3** & **ROLE-4** | Giao diện hiển thị đúng khung trên cả Mobile và Desktop; Frontend gọi được Mock API. |

---

### GÓI CÔNG VIỆC 2: PHÂN HỆ XÁC THỰC & PHÂN QUYỀN (AUTH & RBAC)

| Mã việc | Tên đầu việc | Nhiệm vụ cụ thể | Đầu vào / Phụ thuộc | Sản phẩm bàn giao | Người phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **WP-2.1** | Auth API & Token Handling | Viết API `/register`, `/login`, `/refresh`, `/logout`. Băm mật khẩu bcrypt. Trả Access Token (15p) và gán HttpOnly Refresh Cookie (7d). | WP-1.2, WP-1.3 | Auth Controller & Router kiểm thử qua Postman. | **ROLE-2** | Đăng nhập thành công trả token; Cookie có cờ `HttpOnly`, `SameSite=Strict`. |
| **WP-2.2** | RBAC Guard Middleware | Viết middleware xác thực Token và kiểm tra vai trò: `requireAuth`, `requireRole('employer')`, `requireRole('admin')`. | WP-2.1 | Middleware `authGuard.ts`, `roleGuard.ts`. | **ROLE-2** | Chặn request không hợp lệ với mã `401 Unauthorized` và `403 Forbidden`. |
| **WP-2.3** | Giao diện Đăng ký / Đăng nhập | Dựng Form Đăng ký (chọn vai trò Ứng viên / Tuyển dụng) và Form Đăng nhập. Xử lý validation client, hiển thị thông báo lỗi. | WP-1.4 | Màn hình `/login`, `/register`, Toast phản hồi. | **ROLE-3** | Validate đủ email, password tối thiểu 8 ký tự; lưu trạng thái auth vào context/store. |
| **WP-2.4** | Route Guard Frontend | Xây dựng Private Route chặn người dùng chưa đăng nhập hoặc vào sai phân hệ (Ứng viên không được vào trang quản trị HR). | WP-2.3 | Component `ProtectedRoute.tsx`. | **ROLE-4** | Tự động redirect về `/login` nếu hết phiên; hiển thị trang 403 nếu sai quyền. |

---

### GÓI CÔNG VIỆC 3: PHÂN HỆ TIN TUYỂN DỤNG & TÌM KIẾM (JOB DISCOVERY & MANAGEMENT)

| Mã việc | Tên đầu việc | Nhiệm vụ cụ thể | Đầu vào / Phụ thuộc | Sản phẩm bàn giao | Người phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **WP-3.1** | Job Discovery API (FTS & Filter) | Viết API `GET /api/v1/jobs` hỗ trợ phân trang, lọc theo ngành, địa điểm, mức lương và tìm kiếm từ khóa qua Postgres Full-Text Search. | WP-1.2, WP-1.3 | Job Controller & FTS Query Handler. | **ROLE-1** | Lọc chuẩn xác đa tiêu chí; tốc độ truy vấn $< 150\text{ms}$; chỉ trả tin `approved` & chưa hết hạn. |
| **WP-3.2** | Employer Job CRUD API | Viết API tạo tin (`POST /jobs`), cập nhật (`PUT /jobs/:id`), đóng tin (`PATCH /jobs/:id/status`). Kiểm tra quyền sở hữu bài đăng. | WP-2.2 | Job Management Controller. | **ROLE-2** | Employer A không thể sửa bài của Employer B; slug tự động sinh kèm mã ngẫu nhiên duy nhất. |
| **WP-3.3** | UI Tìm kiếm & Bộ lọc việc làm | Dựng màn hình danh sách việc làm: Slide-over Drawer bộ lọc trên Mobile, Sidebar cố định trên Desktop, phân trang chuẩn RESTful. | WP-1.4, WP-3.1 | Trang `/viec-lam` responsive toàn diện. | **ROLE-3** | Thay đổi bộ lọc cập nhật ngay URL query params; touch target nút lọc $\ge 44\text{px}$. |
| **WP-3.4** | UI Chi tiết việc làm & Breadcrumbs | Màn hình `/viec-lam/:slug`: Chi tiết mô tả, yêu cầu, mức lương, thông tin công ty; Breadcrumbs điều hướng; Sticky Apply Button trên Mobile. | WP-3.3 | Trang chi tiết việc làm. | **ROLE-3** | Không có trang ngõ cụt; hiển thị rõ trạng thái lương thỏa thuận hoặc khoảng lương. |
| **WP-3.5** | UI Quản lý tin tuyển dụng (HR) | Bảng danh sách các tin đã đăng của công ty, bộ đếm số lượng CV đã nộp, nút thao tác Đóng tin / Sửa tin / Xem ứng viên. Form đăng tin mới. | WP-1.4, WP-3.2 | Trang `/nha-tuyen-dung/tin-dang`. | **ROLE-4** | Form có validate; bảng dữ liệu phân trang và hiển thị trạng thái duyệt tin rõ ràng. |

---

### GÓI CÔNG VIỆC 4: ỨNG TUYỂN & XỬ LÝ CV AN TOÀN (APPLICATIONS & RESUME SECURITY)

| Mã việc | Tên đầu việc | Nhiệm vụ cụ thể | Đầu vào / Phụ thuộc | Sản phẩm bàn giao | Người phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **WP-4.1** | Secure Upload Service (Magic Bytes) | API `POST /api/v1/resumes/upload`: Kiểm tra tệp $\le 5\text{MB}$, Content-Type `application/pdf`, đọc 5 bytes đầu kiểm tra `%PDF-`. Đổi tên UUID. | WP-1.3 | Middleware `secureUpload.ts` & Upload Controller. | **ROLE-2** | Chặn đứng tệp giả mạo (ví dụ file `.exe` đổi tên thành `.pdf`); trả về mã lỗi 400 rõ ràng. |
| **WP-4.2** | Application Lifecycle API | API nộp đơn (`POST /jobs/:id/apply`) tự động lưu Snapshot CV; API cập nhật trạng thái đơn (`PATCH /applications/:id/status`). | WP-4.1, WP-2.2 | Application Controller & Snapshot logic. | **ROLE-2** | Chặn nộp trùng lặp 2 lần; lưu đúng snapshot URL độc lập với profile ứng viên. |
| **WP-4.3** | UI Modal Ứng tuyển & Phản hồi | Modal nộp đơn: Cho phép kéo thả CV PDF hoặc chọn CV có sẵn, nhập Cover Letter; hiển thị Loading Skeleton/Spinner khi gửi; thông báo Toast. | WP-3.4, WP-4.2 | Component `ApplyJobModal.tsx`. | **ROLE-3** | Kiểm tra dung lượng file ngay tại Client; sau khi nộp thành công hiển thị CTA điều hướng tiếp. |
| **WP-4.4** | UI Nhà tuyển dụng xét duyệt hồ sơ | Màn hình xem danh sách ứng viên nộp theo Job: Xem thông tin, nút mở xem PDF an toàn, nút chuyển trạng thái (Mời phỏng vấn / Từ chối). | WP-3.5, WP-4.2 | Trang `/nha-tuyen-dung/ung-vien`. | **ROLE-4** | Tích hợp modal chọn lịch phỏng vấn; cập nhật trạng thái thời gian thực trên bảng. |

---

### GÓI CÔNG VIỆC 5: HÀNG ĐỢI EMAIL THÔNG BÁO & TRẢI NGHIỆM ỨNG VIÊN (ASYNC WORKER & UX)

| Mã việc | Tên đầu việc | Nhiệm vụ cụ thể | Đầu vào / Phụ thuộc | Sản phẩm bàn giao | Người phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **WP-5.1** | Background Email Worker (BullMQ) | Cấu hình Redis & BullMQ: Khi HR đổi trạng thái hồ sơ, đẩy Job gửi email ngầm; tích hợp Resend/Nodemailer; cơ chế retry 3 lần. | WP-4.2 | Queue Producer & Worker Process. | **ROLE-2** | API đổi trạng thái phản hồi $< 50\text{ms}$; email tự động gửi đến hòm thư ứng viên sau vài giây. |
| **WP-5.2** | UI Ứng viên: Lịch sử ứng tuyển | Trang cá nhân ứng viên xem danh sách các vị trí đã nộp, Badge trạng thái (Đã nộp $\rightarrow$ Đã xem $\rightarrow$ Mời phỏng vấn $\rightarrow$ Kết quả), thời gian hẹn phỏng vấn. | WP-4.2, WP-2.4 | Trang `/ung-vien/lich-su-ung-tuyen`. | **ROLE-3** | Hiển thị dòng thời gian (Timeline) rõ ràng; không có trạng thái mập mờ. |
| **WP-5.3** | UI Admin: Quản trị & Duyệt tin | Giao diện dành riêng cho Admin: Duyệt tin tuyển dụng của doanh nghiệp (`pending` $\rightarrow$ `approved` / `rejected`), khóa tài khoản vi phạm. | WP-2.2, WP-3.2 | Trang `/admin/kiem-duyet`. | **ROLE-4** | Admin thao tác duyệt nhanh bằng 1 click; phân quyền bảo vệ nghiêm ngặt. |

---

### GÓI CÔNG VIỆC 6: KIỂM THỬ TOÀN DIỆN, BẢO MẬT & NGHIỆM THU (QA & AUDIT)

| Mã việc | Tên đầu việc | Nhiệm vụ cụ thể | Đầu vào / Phụ thuộc | Sản phẩm bàn giao | Người phụ trách | Tiêu chí nghiệm thu (Acceptance Criteria) |
| :---: | :--- | :--- | :---: | :--- | :---: | :--- |
| **WP-6.1** | Security & Edge Case Audit | Kiểm thử thử nghiệm thâm nhập: SQL Injection, XSS, CSRF, IDOR (sửa ID trên URL), vượt quyền Admin, upload file rác. | Gói 1 - 5 | Báo cáo Security Checklist & bản vá. | **ROLE-1** & **ROLE-2** | 100% các lỗ hổng biên được chặn đứng ở cả tầng Middleware lẫn CSDL. |
| **WP-6.2** | Responsive & Accessibility Audit | Chạy audit Google Lighthouse trên các trang trọng yếu; kiểm tra tỷ lệ tương phản chữ $\ge 4.5:1$, kiểm tra thẻ `alt`, `aria-label`, kiểm tra Zero Dead-Ends. | Gói 1 - 5 | Điểm Lighthouse Audit report. | **ROLE-3** & **ROLE-4** | Điểm Accessibility $\ge 90$; không có phần tử bị tràn ngang trên màn hình di động $375\text{px}$. |
| **WP-6.3** | Kịch bản Demo thông luồng (E2E) | Chuẩn bị dữ liệu mẫu và kịch bản trình diễn từ A đến Z: Đăng ký HR $\rightarrow$ Đăng tin $\rightarrow$ Admin duyệt $\rightarrow$ Ứng viên tìm kiếm $\rightarrow$ Nộp CV $\rightarrow$ HR duyệt $\rightarrow$ Nhận Email. | Hoàn tất | Kịch bản demo và video/tài liệu kiểm thử. | **Cả nhóm** | Luồng nghiệp vụ chạy mượt mà, không gặp lỗi runtime, thời gian phản hồi nhanh. |

---

## 5. QUY CHUẨN PHỐI HỢP GIT & ĐỊNH NGHĨA HOÀN THÀNH (GIT WORKFLOW & DoD)

### 5.1. Quy ước phân nhánh Git (Branching Strategy)
* Nhánh `main`: Chỉ chứa mã nguồn Production đã qua kiểm thử và sẵn sàng báo cáo/triển khai.
* Nhánh `develop`: Nhánh tích hợp chính của nhóm.
* Mỗi đầu việc tạo một nhánh riêng từ `develop`:
  * Tính năng mới: `feature/<mã-việc>-<tên-ngắn>` *(Ví dụ: `feature/wp-4.1-secure-upload`)*
  * Sửa lỗi: `fix/<mã-lỗi>-<mô-tả>` *(Ví dụ: `fix/search-filter-null`)*

### 5.2. Quy ước thông điệp Commit (Conventional Commits)
Mọi commit bắt buộc tuân thủ tiền tố:
* `feat:` Tính năng mới (ví dụ: `feat: implement magic bytes pdf validation`)
* `fix:` Sửa lỗi (ví dụ: `fix: resolve unique slug conflict on job create`)
* `docs:` Viết tài liệu (ví dụ: `docs: update api contract for jobs`)
* `refactor:` Tối ưu cấu trúc mã nguồn không làm đổi logic
* `style:` Định dạng CSS, khoảng trắng, linter

### 5.3. Quy trình Pull Request (PR Review Rule)
1. Tuyệt đối không ai được commit trực tiếp vào `main` hoặc `develop`.
2. Khi hoàn thành task, mở Pull Request trỏ vào `develop`.
3. Bắt buộc phải có **ít nhất 1 thành viên khác (ưu tiên Tech Lead) review và ấn Approve** mới được Merge.
4. Tự động xóa nhánh feature sau khi merge thành công.

### 5.4. Tiêu chuẩn nghiệm thu từng tính năng (Definition of Done - DoD)
Một Issue chỉ được chuyển sang cột **DONE** trên bảng công việc khi thỏa mãn 5 điều kiện:
1. [ ] Mã nguồn chạy sạch linter, không có cảnh báo nghiêm trọng (`npm run lint`).
2. [ ] API phản hồi đúng cấu trúc JSON Envelope chuẩn tại Mục 4.1 của Đặc tả.
3. [ ] Xử lý đầy đủ trường hợp lỗi (Happy Path và Unhappy Path / Edge Cases).
4. [ ] Giao diện co giãn chuẩn trên cả Mobile ($375\text{px}$) và Desktop ($1440\text{px}$).
5. [ ] Đã được kiểm thử trên môi trường local của ít nhất 2 thành viên trong nhóm.

