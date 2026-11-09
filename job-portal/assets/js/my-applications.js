/**
 * ==========================================================================
 * MODULE 3: THEO DÕI TIẾN ĐỘ ỨNG TUYỂN (MY APPLICATIONS & 4-STEP STEPPER)
 * --------------------------------------------------------------------------
 * Thành viên đảm nhiệm: NGUYỄN PHÚ QUANG
 * Mã số sinh viên (MSSV): 036206029474
 * Nhóm 6 — Lập trình Website — GVHD: ThS. Trần Thịnh Mạnh Đức — UTH
 * Căn cứ thiết kế: Wireframe Mục 5.4 Phân Hệ Ứng Viên trong QTTK.html
 * 
 * TÍNH NĂNG CHÍNH:
 *   1. Quản lý danh sách đơn ứng tuyển đã nộp (Đọc từ localStorage: jobportal_applied_jobs)
 *   2. Thành phần 4-Step Recruitment Stepper chuẩn Wireframe 5.4:
 *        1. Đã nộp đơn  ->  2. Doanh nghiệp đã xem  ->  3. Hẹn phỏng vấn  ->  4. Kết quả cuối cùng
 *   3. Bộ đếm KPI thống kê số lượng đơn theo từng giai đoạn
 *   4. Bộ lọc tìm kiếm theo từ khóa & Lọc theo trạng thái tiến trình
 *   5. Hộp thoại xem chi tiết lịch phỏng vấn & Thư giới thiệu (Cover Letter)
 *   6. Thao tác Rút đơn ứng tuyển an toàn (Withdraw Application)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const STORAGE_KEY = 'jobportal_applied_jobs';
  const SESSION_KEY = 'jobportal_session';

  // Helper đọc LocalStorage
  function getAppliedJobs() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Lỗi đọc đơn ứng tuyển:', e);
      return [];
    }
  }

  // Helper lưu LocalStorage
  function saveAppliedJobs(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Lỗi lưu đơn ứng tuyển:', e);
    }
  }

  // Đọc session người dùng
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (e) {}

  const currentUserName = (session && (session.fullName || session.name)) || 'Nguyễn Phú Quang';
  const currentUserEmail = (session && session.email) || 'quang.np@student.ut.edu.vn';

  // --------------------------------------------------------------------------
  // 1. KHỞI TẠO DỮ LIỆU ĐƠN ỨNG TUYỂN MẪU CHUẨN MỤC 5.4 TRONG QTTK.HTML
  // --------------------------------------------------------------------------
  let applications = getAppliedJobs();

  if (!Array.isArray(applications) || applications.length === 0) {
    applications = [
      {
        id: 'app-fpt-01',
        jobId: 'job-02',
        jobTitle: 'Junior Backend Node.js / NestJS Engineer',
        company: 'FPT Software Global',
        companyLogo: 'FPT',
        companyLogoBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
        salary: '14 - 20 Triệu',
        location: 'TP. Thủ Đức, TP.HCM',
        applicantName: currentUserName,
        applicantEmail: currentUserEmail,
        applicantPhone: '0901 234 567',
        fileName: 'CV_TranHuuThanh_Backend.pdf',
        fileSize: '1.25 MB',
        coverLetter: 'Em có 1 năm kinh nghiệm xây dựng RESTful API với Express và NestJS. Em mong muốn được gia nhập FPT Software để phát triển các dự án Microservices quy mô quốc tế.',
        appliedAt: '24/10/2026 08:30',
        status: 'interview', // 1: submitted, 2: viewed, 3: interview, 4: offer / rejected
        statusText: 'Hẹn phỏng vấn',
        stepIndex: 3, // Đang ở Bước 3
        timeline: {
          step1: { title: '1. ĐÃ NỘP ĐƠN', date: '24/10 08:30', completed: true },
          step2: { title: '2. DOANH NGHIỆP ĐÃ XEM', date: '25/10 14:15', completed: true },
          step3: { title: '3. HẸN PHỎNG VẤN', date: 'Đã gửi lịch qua Email', active: true },
          step4: { title: '4. KẾT QUẢ CUỐI CÙNG', date: 'Đang chờ đánh giá', pending: true }
        },
        interviewInfo: {
          time: '09:30 - Thứ Hai, ngày 15/11/2026',
          format: 'Phỏng vấn Trực tuyến (Online Interview)',
          platform: 'Microsoft Teams Meeting',
          meetingLink: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_fpt_software',
          interviewers: 'Anh Nguyễn Minh Đức (Tech Lead) & Chị Trần Mai Anh (Senior HR)',
          note: 'Ứng viên vui lòng chuẩn bị máy tính có webcam, micro và chuẩn bị trình bày tóm tắt 1 dự án Backend Node.js tiêu biểu trong 10 phút.'
        },
        feedback: 'FPT Software đã duyệt hồ sơ của bạn và đánh giá cao kỹ năng NestJS. Lịch phỏng vấn kỹ thuật online đã được xác nhận vào lúc 09:30 ngày 15/11/2026 qua Microsoft Teams.'
      },
      {
        id: 'app-vng-02',
        jobId: 'job-01',
        jobTitle: 'Frontend React Developer (Junior / Middle)',
        company: 'Công Ty Cổ Phần Công Nghệ VNG',
        companyLogo: 'VNG',
        companyLogoBg: 'linear-gradient(135deg, #ff6b4a 0%, #ff8e53 100%)',
        salary: '15 - 22 Triệu',
        location: 'Quận 7, TP.HCM',
        applicantName: currentUserName,
        applicantEmail: currentUserEmail,
        applicantPhone: '0901 234 567',
        fileName: 'CV_NguyenPhuQuang_Frontend_2026.pdf',
        fileSize: '1.45 MB',
        coverLetter: 'Em tự tin với khả năng tối ưu hóa hiệu năng Core Web Vitals, Responsive HTML5/CSS3 và thành thạo Redux Toolkit.',
        appliedAt: '25/10/2026 14:15',
        status: 'viewed',
        statusText: 'Doanh nghiệp đã xem',
        stepIndex: 2, // Đang ở Bước 2
        timeline: {
          step1: { title: '1. ĐÃ NỘP ĐƠN', date: '25/10 14:15', completed: true },
          step2: { title: '2. DOANH NGHIỆP ĐÃ XEM', date: '26/10 09:20', active: true },
          step3: { title: '3. HẸN PHỎNG VẤN', date: 'Đang xét duyệt', pending: true },
          step4: { title: '4. KẾT QUẢ CUỐI CÙNG', date: 'Chưa có', pending: true }
        },
        feedback: 'Phòng Nhân sự VNG Campus đã mở xem và tải bản chụp CV của bạn. Hồ sơ đang được chuyển sang Trưởng bộ phận Zalo Web thẩm định năng lực.'
      },
      {
        id: 'app-viettel-03',
        jobId: 'job-03',
        jobTitle: 'Thực Tập Sinh Lập Trình Java / Spring Boot',
        company: 'Viettel Solutions (Tập Đoàn Viễn Thông Quân Đội)',
        companyLogo: 'VT',
        companyLogoBg: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        salary: '6 - 8 Triệu (Hỗ trợ)',
        location: 'Cầu Giấy, Hà Nội',
        applicantName: currentUserName,
        applicantEmail: currentUserEmail,
        applicantPhone: '0901 234 567',
        fileName: 'CV_NguyenPhuQuang_JavaIntern.pdf',
        fileSize: '1.10 MB',
        coverLetter: 'Em là sinh viên năm cuối CNTT UTH, mong muốn được thực tập và cống hiến lâu dài tại Viettel.',
        appliedAt: '18/10/2026 10:00',
        status: 'offer',
        statusText: 'Trúng tuyển / Đã gửi Offer',
        stepIndex: 4, // Đang ở Bước 4 - Hoàn tất
        timeline: {
          step1: { title: '1. ĐÃ NỘP ĐƠN', date: '18/10 10:00', completed: true },
          step2: { title: '2. DOANH NGHIỆP ĐÃ XEM', date: '19/10 15:30', completed: true },
          step3: { title: '3. HẸN PHỎNG VẤN', date: '23/10 14:00', completed: true },
          step4: { title: '4. KẾT QUẢ CUỐI CÙNG', date: '🎉 Trúng Tuyển', completed: true, isOffer: true }
        },
        feedback: '🎉 CHÚC MỪNG BẠN! Hội đồng tuyển dụng Viettel Solutions trân trọng thông báo bạn đã xuất sắc vượt qua vòng phỏng vấn chuyên môn và được tiếp nhận vào chương trình Tài năng Kỹ sư Trẻ 2026. Thư mời nhận việc (Offer Letter) đã gửi qua Email của bạn.'
      },
      {
        id: 'app-momo-04',
        jobId: 'job-04',
        jobTitle: 'Chuyên Viên Phân Tích Dữ Liệu (Data Analyst)',
        company: 'Ví MoMo (M Service FinTech)',
        companyLogo: 'MM',
        companyLogoBg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
        salary: '16 - 24 Triệu',
        location: 'Quận 7, TP.HCM',
        applicantName: currentUserName,
        applicantEmail: currentUserEmail,
        applicantPhone: '0901 234 567',
        fileName: 'CV_NguyenPhuQuang_DataAnalyst.pdf',
        fileSize: '1.30 MB',
        coverLetter: 'Em có chứng chỉ phân tích dữ liệu Google Data Analytics và thành thạo SQL/Python/Tableau.',
        appliedAt: 'Hôm nay, 08:15',
        status: 'submitted',
        statusText: 'Đã nộp đơn thành công',
        stepIndex: 1, // Đang ở Bước 1
        timeline: {
          step1: { title: '1. ĐÃ NỘP ĐƠN', date: 'Hôm nay 08:15', active: true },
          step2: { title: '2. DOANH NGHIỆP ĐÃ XEM', date: 'Đang xếp hàng duyệt', pending: true },
          step3: { title: '3. HẸN PHỎNG VẤN', date: 'Chưa có', pending: true },
          step4: { title: '4. KẾT QUẢ CUỐI CÙNG', date: 'Chưa có', pending: true }
        },
        feedback: 'Hồ sơ đã gửi thành công vào cổng thông tin MoMo FinTech. Thời gian phản hồi dự kiến từ 24h - 48h làm việc.'
      }
    ];
    saveAppliedJobs(applications);
  }

  // --------------------------------------------------------------------------
  // 2. STATE QUẢN LÝ TÌM KIẾM & BỘ LỌC
  // --------------------------------------------------------------------------
  let currentFilter = 'all'; // all, submitted, viewed, interview, offer, rejected
  let searchKeyword = '';

  // DOM Elements
  const applicationsContainer = document.getElementById('myApplicationsList');
  const searchInput = document.getElementById('appSearchInput');
  const filterPills = document.querySelectorAll('.app-filter-pill');

  // KPI elements
  const statTotal = document.getElementById('statTotal');
  const statViewed = document.getElementById('statViewed');
  const statInterview = document.getElementById('statInterview');
  const statOffer = document.getElementById('statOffer');
  const sidebarCountBadge = document.getElementById('sidebarAppCount');

  // --------------------------------------------------------------------------
  // 3. CẬP NHẬT CHỈ SỐ KPI THỐNG KÊ (STAT METRICS)
  // --------------------------------------------------------------------------
  function updateKPIs() {
    applications = getAppliedJobs();

    const total = applications.length;
    const viewed = applications.filter(a => a.status === 'viewed').length;
    const interview = applications.filter(a => a.status === 'interview').length;
    const offer = applications.filter(a => a.status === 'offer' || a.status === 'accepted').length;

    if (statTotal) statTotal.textContent = total;
    if (statViewed) statViewed.textContent = viewed;
    if (statInterview) statInterview.textContent = interview;
    if (statOffer) statOffer.textContent = offer;
    if (sidebarCountBadge) sidebarCountBadge.textContent = total;

    // Cập nhật số lượng trên các tab lọc
    document.querySelectorAll('.app-filter-pill').forEach(pill => {
      const status = pill.getAttribute('data-status');
      const countSpan = pill.querySelector('.pill-count');
      if (countSpan) {
        if (status === 'all') countSpan.textContent = total;
        else if (status === 'submitted') countSpan.textContent = applications.filter(a => a.status === 'submitted').length;
        else if (status === 'viewed') countSpan.textContent = viewed;
        else if (status === 'interview') countSpan.textContent = interview;
        else if (status === 'offer') countSpan.textContent = offer;
        else if (status === 'rejected') countSpan.textContent = applications.filter(a => a.status === 'rejected').length;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. HIỂN THỊ DANH SÁCH ĐƠN ỨNG TUYỂN VỚI STEPPER 4 BƯỚC
  // --------------------------------------------------------------------------
  function renderApplications() {
    if (!applicationsContainer) return;

    applications = getAppliedJobs();

    // Lọc theo trạng thái và từ khóa tìm kiếm
    const filtered = applications.filter(app => {
      // Lọc trạng thái
      let matchStatus = true;
      if (currentFilter === 'submitted') matchStatus = (app.status === 'submitted');
      else if (currentFilter === 'viewed') matchStatus = (app.status === 'viewed');
      else if (currentFilter === 'interview') matchStatus = (app.status === 'interview');
      else if (currentFilter === 'offer') matchStatus = (app.status === 'offer' || app.status === 'accepted');
      else if (currentFilter === 'rejected') matchStatus = (app.status === 'rejected');

      // Lọc từ khóa
      let matchKeyword = true;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const searchable = `${app.jobTitle} ${app.company} ${app.salary} ${app.location}`.toLowerCase();
        matchKeyword = searchable.includes(kw);
      }

      return matchStatus && matchKeyword;
    });

    // Trường hợp danh sách rỗng (Zero Dead-Ends Rule)
    if (filtered.length === 0) {
      applicationsContainer.innerHTML = `
        <div class="candidate-empty-state">
          <div class="empty-state-icon">📂</div>
          <h3 class="empty-state-title">Không tìm thấy đơn ứng tuyển nào!</h3>
          <p class="empty-state-desc">
            ${searchKeyword ? `Không có kết quả khớp với từ khóa "${searchKeyword}". Hãy thử tìm kiếm từ khóa khác.` : 'Bạn chưa có hồ sơ nào ở danh mục này. Hãy tiếp tục ứng tuyển các vị trí việc làm IT đang mở!'}
          </p>
          <a href="./jobs.html" class="btn-primary" style="text-decoration: none;">
            <span>🔍 Khám Phá Việc Làm Ngay</span>
          </a>
        </div>
      `;
      return;
    }

    // Render danh sách các đơn ứng tuyển
    applicationsContainer.innerHTML = filtered.map(app => {
      const step = app.stepIndex || 1;
      const isRejected = (app.status === 'rejected');
      const isOffer = (app.status === 'offer' || app.status === 'accepted');

      // Xác định badge trạng thái
      let badgeHtml = '';
      if (app.status === 'submitted') {
        badgeHtml = '<span class="status-badge" style="background:#dbeafe; color:#1e40af;">📨 Đã nộp đơn</span>';
      } else if (app.status === 'viewed') {
        badgeHtml = '<span class="status-badge" style="background:#e0f2fe; color:#0369a1;">👁️ Đã xem hồ sơ</span>';
      } else if (app.status === 'interview') {
        badgeHtml = '<span class="status-badge" style="background:#fef3c7; color:#b45309;">📅 Hẹn phỏng vấn</span>';
      } else if (isOffer) {
        badgeHtml = '<span class="status-badge" style="background:#ecfdf5; color:#065f46;">🎉 Trúng tuyển</span>';
      } else if (isRejected) {
        badgeHtml = '<span class="status-badge" style="background:#fee2e2; color:#b91c1c;">✕ Chưa phù hợp</span>';
      }

      // Xác định ngày tháng từng bước
      const step1Date = (app.timeline && app.timeline.step1 && app.timeline.step1.date) || app.appliedAt.slice(0, 10);
      const step2Date = (app.timeline && app.timeline.step2 && app.timeline.step2.date) || (step >= 2 ? 'Đã xem' : 'Chờ duyệt');
      const step3Date = (app.timeline && app.timeline.step3 && app.timeline.step3.date) || (step >= 3 ? 'Đã xếp lịch' : 'Chờ xét');
      const step4Date = (app.timeline && app.timeline.step4 && app.timeline.step4.date) || (isOffer ? '🎉 Trúng tuyển' : (isRejected ? 'Từ chối' : 'Đang đánh giá'));

      return `
        <article class="application-card status-${app.status}" data-id="${app.id}">
          <!-- Phần đầu thẻ: Logo, Tên việc làm, Tên công ty, Mức lương -->
          <div class="app-card-header">
            <div class="app-job-info">
              <div class="app-company-logo" style="background: ${app.companyLogoBg || '#1e40af'};" aria-hidden="true">
                ${app.companyLogo || app.company.charAt(0)}
              </div>
              <div class="app-job-details">
                <h2>
                  <a href="./job-detail.html?id=${app.jobId}">${app.jobTitle}</a>
                </h2>
                <div class="app-job-subinfo">
                  <span>🏢 <strong>${app.company}</strong></span>
                  <span>📍 ${app.location || 'TP.HCM'}</span>
                  <span>💰 <strong>${app.salary || 'Thỏa thuận'}</strong></span>
                </div>
              </div>
            </div>
            <div>
              ${badgeHtml}
            </div>
          </div>

          <!-- Dải thông tin bản chụp CV bất biến (Immutable Snapshot) -->
          <div class="app-snapshot-strip">
            <div class="snapshot-file-badge">
              <span>📄</span>
              <span>Bản chụp CV: <strong>${app.fileName || 'CV_UngVien.pdf'}</strong> (${app.fileSize || '1.25 MB'})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="color: var(--color-muted); font-size: 0.8rem;">🕒 Nộp lúc: <strong>${app.appliedAt}</strong></span>
              <button type="button" class="btn-outline btn-sm btn-download-snapshot" data-file="${app.fileName}" title="Tải xuống bản sao CV này">
                <i class="fa-solid fa-download"></i> Tải CV
              </button>
            </div>
          </div>

          <!-- ===================================================================
               THÀNH PHẦN 4-STEP RECRUITMENT STEPPER (CHUẨN WIREFRAME 5.4 QTTK.HTML)
               =================================================================== -->
          <div class="stepper-timeline-box" aria-label="Tiến trình tuyển dụng 4 bước">
            <div class="stepper-timeline-header">
              <span>TIẾN TRÌNH TUYỂN DỤNG THEO THỜI GIAN THỰC</span>
              <span>BƯỚC ${step}/4</span>
            </div>

            <div class="stepper-track">
              <!-- BƯỚC 1: ĐÃ NỘP ĐƠN -->
              <div class="step-node ${step >= 1 ? 'completed' : 'pending'}">
                <div class="step-icon-bubble">
                  ${step >= 1 ? '✓' : '1'}
                </div>
                <div class="step-label-title">1. ĐÃ NỘP ĐƠN</div>
                <div class="step-label-desc">${step1Date}</div>
              </div>

              <div class="step-line ${step >= 2 ? 'completed' : (step === 1 ? 'active' : '')}"></div>

              <!-- BƯỚC 2: DOANH NGHIỆP ĐÃ XEM -->
              <div class="step-node ${step > 2 ? 'completed' : (step === 2 ? 'active' : 'pending')}">
                <div class="step-icon-bubble">
                  ${step > 2 ? '✓' : (step === 2 ? '2' : '2')}
                </div>
                <div class="step-label-title">2. ĐÃ XEM CV</div>
                <div class="step-label-desc">${step2Date}</div>
              </div>

              <div class="step-line ${step >= 3 ? 'completed' : (step === 2 ? 'active' : '')}"></div>

              <!-- BƯỚC 3: HẸN PHỎNG VẤN -->
              <div class="step-node ${step > 3 ? 'completed' : (step === 3 ? 'active' : 'pending')}">
                <div class="step-icon-bubble">
                  ${step > 3 ? '✓' : (step === 3 ? '3' : '3')}
                </div>
                <div class="step-label-title">3. HẸN PHỎNG VẤN</div>
                <div class="step-label-desc">${step3Date}</div>
              </div>

              <div class="step-line ${step >= 4 ? (isRejected ? 'rejected' : 'completed') : (step === 3 ? 'active' : '')}"></div>

              <!-- BƯỚC 4: KẾT QUẢ CUỐI CÙNG -->
              <div class="step-node ${isOffer ? 'completed' : (isRejected ? 'rejected' : (step === 4 ? 'active' : 'pending'))}">
                <div class="step-icon-bubble">
                  ${isOffer ? '🏆' : (isRejected ? '✕' : '4')}
                </div>
                <div class="step-label-title">4. KẾT QUẢ</div>
                <div class="step-label-desc">${step4Date}</div>
              </div>
            </div>
          </div>

          <!-- Thông báo chi tiết từ Nhà Tuyển Dụng nếu có -->
          ${app.feedback ? `
            <div class="app-feedback-box ${isOffer ? 'feedback-offer' : (isRejected ? 'feedback-rejected' : 'feedback-interview')}">
              <i class="${isOffer ? 'fa-solid fa-trophy' : (isRejected ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-bullhorn')}" style="font-size: 1.2rem; flex-shrink: 0; margin-top: 2px;"></i>
              <div>
                <strong>Thông báo từ Phòng Nhân sự (${app.company}):</strong>
                <p style="margin: 4px 0 0; line-height: 1.5;">${app.feedback}</p>
              </div>
            </div>
          ` : ''}

          <!-- Chân thẻ: Các nút hành động -->
          <div class="app-card-actions">
            <div class="app-card-btn-group">
              <a href="./job-detail.html?id=${app.jobId}" class="btn-outline btn-sm">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> Xem lại JD việc làm
              </a>

              ${app.interviewInfo ? `
                <button type="button" class="btn-primary btn-sm btn-view-interview" data-id="${app.id}">
                  <i class="fa-solid fa-calendar-check"></i> Xem lịch phỏng vấn
                </button>
              ` : ''}

              ${app.coverLetter ? `
                <button type="button" class="btn-outline btn-sm btn-view-letter" data-id="${app.id}">
                  <i class="fa-solid fa-envelope-open-text"></i> Thư giới thiệu
                </button>
              ` : ''}
            </div>

            <div>
              <button type="button" class="btn-delete-item btn-withdraw-app" data-id="${app.id}" title="Hủy bỏ đơn ứng tuyển này">
                <i class="fa-solid fa-trash-can"></i> Rút đơn ứng tuyển
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachCardEventListeners();
  }

  // --------------------------------------------------------------------------
  // 5. GẮN SỰ KIỆN TƯƠNG TÁC CHO CÁC NÚT TRÊN CARD
  // --------------------------------------------------------------------------
  function attachCardEventListeners() {
    // 1. Tải CV mô phỏng
    applicationsContainer.querySelectorAll('.btn-download-snapshot').forEach(btn => {
      btn.addEventListener('click', function () {
        const file = this.getAttribute('data-file') || 'CV.pdf';
        if (window.showToast) {
          window.showToast(`Đang tải tệp bản chụp: ${file}...`, 'info');
        }
      });
    });

    // 2. Rút đơn ứng tuyển
    applicationsContainer.querySelectorAll('.btn-withdraw-app').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const item = applications.find(a => a.id === id);
        const jobTitle = item ? item.jobTitle : 'vị trí này';

        if (confirm(`Bạn có chắc chắn muốn rút đơn ứng tuyển cho "${jobTitle}" không?\n\nLưu ý: Hành động này sẽ hủy tiến trình tuyển dụng và không thể hoàn tác.`)) {
          applications = applications.filter(a => a.id !== id);
          saveAppliedJobs(applications);
          updateKPIs();
          renderApplications();

          if (window.showToast) {
            window.showToast(`Đã rút đơn ứng tuyển vị trí "${jobTitle}".`, 'warning');
          }
        }
      });
    });

    // 3. Xem chi tiết lịch phỏng vấn
    applicationsContainer.querySelectorAll('.btn-view-interview').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const item = applications.find(a => a.id === id);
        if (item && item.interviewInfo) {
          openInterviewModal(item);
        }
      });
    });

    // 4. Xem thư giới thiệu
    applicationsContainer.querySelectorAll('.btn-view-letter').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const item = applications.find(a => a.id === id);
        if (item) {
          openCoverLetterModal(item);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 6. XỬ LÝ HỘP THOẠI MODAL PHỎNG VẤN & THƯ GIỚI THIỆU
  // --------------------------------------------------------------------------
  const modalBackdrop = document.getElementById('interviewModal');
  const modalJobTitle = document.getElementById('modalInterviewJobTitle');
  const modalCompany = document.getElementById('modalInterviewCompany');
  const modalTime = document.getElementById('modalInterviewTime');
  const modalFormat = document.getElementById('modalInterviewFormat');
  const modalPlatform = document.getElementById('modalInterviewPlatform');
  const modalLink = document.getElementById('modalInterviewLink');
  const modalInterviewers = document.getElementById('modalInterviewInterviewers');
  const modalNote = document.getElementById('modalInterviewNote');
  const btnCloseModal = document.getElementById('btnCloseInterviewModal');

  function openInterviewModal(app) {
    if (!modalBackdrop) return;
    const info = app.interviewInfo;

    if (modalJobTitle) modalJobTitle.textContent = app.jobTitle;
    if (modalCompany) modalCompany.textContent = app.company;
    if (modalTime) modalTime.textContent = info.time;
    if (modalFormat) modalFormat.textContent = info.format;
    if (modalPlatform) modalPlatform.textContent = info.platform;
    if (modalLink) {
      modalLink.href = info.meetingLink || '#';
      modalLink.textContent = info.meetingLink || 'Nhấn để vào phòng họp';
    }
    if (modalInterviewers) modalInterviewers.textContent = info.interviewers;
    if (modalNote) modalNote.textContent = info.note;

    modalBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeInterviewModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', closeInterviewModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closeInterviewModal();
    });
  }

  // Modal thư giới thiệu
  const letterModal = document.getElementById('letterModal');
  const letterJobTitle = document.getElementById('letterJobTitle');
  const letterContent = document.getElementById('letterContent');
  const btnCloseLetter = document.getElementById('btnCloseLetterModal');

  function openCoverLetterModal(app) {
    if (!letterModal) return;
    if (letterJobTitle) letterJobTitle.textContent = `${app.jobTitle} — ${app.company}`;
    if (letterContent) letterContent.textContent = app.coverLetter || 'Ứng viên không nhập thư giới thiệu.';
    letterModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeCoverLetterModal() {
    if (!letterModal) return;
    letterModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (btnCloseLetter) btnCloseLetter.addEventListener('click', closeCoverLetterModal);
  if (letterModal) {
    letterModal.addEventListener('click', function (e) {
      if (e.target === letterModal) closeCoverLetterModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeInterviewModal();
      closeCoverLetterModal();
    }
  });

  // --------------------------------------------------------------------------
  // 7. XỬ LÝ SỰ KIỆN TÌM KIẾM & BỘ LỌC TABS
  // --------------------------------------------------------------------------
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      searchKeyword = e.target.value.trim();
      renderApplications();
    });
  }

  filterPills.forEach(pill => {
    pill.addEventListener('click', function () {
      filterPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentFilter = this.getAttribute('data-status') || 'all';
      renderApplications();
    });
  });

  // --------------------------------------------------------------------------
  // 8. ĐĂNG XUẤT (LOGOUT)
  // --------------------------------------------------------------------------
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi JobPortal?')) {
        localStorage.removeItem(SESSION_KEY);
        if (window.showToast) window.showToast('Đã đăng xuất thành công!', 'info');
        setTimeout(() => {
          window.location.href = './index.html';
        }, 500);
      }
    });
  }

  // Khởi động trang
  updateKPIs();
  renderApplications();
});
