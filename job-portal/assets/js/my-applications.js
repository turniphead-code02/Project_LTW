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
 *   1. Quản lý danh sách đơn ứng tuyển đã nộp (Đồng bộ MySQL qua /api/v1/candidate/applications)
 *   2. Thành phần 4-Step Recruitment Stepper chuẩn Wireframe 5.4:
 *        1. Đã nộp đơn  ->  2. Doanh nghiệp đã xem  ->  3. Hẹn phỏng vấn  ->  4. Kết quả cuối cùng
 *   3. Bộ đếm KPI thống kê số lượng đơn theo từng giai đoạn
 *   4. Bộ lọc tìm kiếm theo từ khóa & Lọc theo trạng thái tiến trình
 *   5. Hộp thoại xem chi tiết lịch phỏng vấn & Thư giới thiệu (Cover Letter)
 *   6. Thao tác Rút đơn ứng tuyển an toàn (DELETE qua REST API)
 *   7. Cơ chế Graceful Fallback đảm bảo giao diện luôn mượt mà cả khi offline
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const API = window.JobPortalAPI;
  const SESSION_KEY = 'jobportal_session';

  function hasAuth() {
    return Boolean(API && typeof API.getToken === 'function' && API.getToken());
  }

  // Bảo vệ phân quyền trang Ứng viên (Client-side RBAC Guard)
  (function enforceCandidateRole() {
    try {
      const token = (API && API.getToken && API.getToken()) || localStorage.getItem('jobportal_access_token');
      const raw = localStorage.getItem(SESSION_KEY);
      const sess = raw ? JSON.parse(raw) : null;
      if (!token || !sess) {
        window.location.replace('./auth.html?mode=login');
        return;
      }
      const role = String(sess.role || '').toLowerCase();
      if (role === 'employer') {
        window.location.replace('./employer-dashboard.html');
      } else if (role === 'admin') {
        window.location.replace('./admin-portal.html');
      }
    } catch (_) {}
  })();

  // Đọc session người dùng
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  } catch (e) {}

  const currentUserName = (session && (session.fullName || session.name)) || 'Ứng viên';
  const currentUserEmail = (session && session.email) || '';

  const UI = window.CandidateUI || {};
  const escapeHtml = UI.escapeHtml || (s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])));

  if (typeof UI.hydrateHeader === 'function') {
    UI.hydrateHeader(currentUserName);
  }

  function openCandConfirm(title, message, onConfirm) {
    if (typeof UI.openConfirm === 'function') {
      UI.openConfirm(title, message, onConfirm);
    }
  }

  // --------------------------------------------------------------------------
  // 1. DANH SÁCH ĐƠN ỨNG TUYỂN (NẠP TỪ API BACKEND)
  // --------------------------------------------------------------------------
  let applications = [];

  // --------------------------------------------------------------------------
  // 2. STATE BỘ LỌC & DOM ELEMENTS
  // --------------------------------------------------------------------------
  let currentFilter = 'all';
  let searchKeyword = '';

  const applicationsContainer = document.getElementById('myApplicationsList');
  const searchInput = document.getElementById('appSearchInput');
  const filterPills = document.querySelectorAll('.app-filter-pill');

  const statTotal = document.getElementById('statTotal');
  const statViewed = document.getElementById('statViewed');
  const statInterview = document.getElementById('statInterview');
  const statOffer = document.getElementById('statOffer');
  const sidebarCountBadge = document.getElementById('sidebarAppCount');

  // --------------------------------------------------------------------------
  // 3. CẬP NHẬT CHỈ SỐ KPI THỐNG KÊ
  // --------------------------------------------------------------------------
  function updateKPIs() {
    const total = applications.length;
    const viewed = applications.filter(a => a.status === 'viewed').length;
    const interview = applications.filter(a => a.status === 'interview').length;
    const offer = applications.filter(a => a.status === 'offer' || a.status === 'accepted').length;

    if (statTotal) statTotal.textContent = total;
    if (statViewed) statViewed.textContent = viewed;
    if (statInterview) statInterview.textContent = interview;
    if (statOffer) statOffer.textContent = offer;
    if (sidebarCountBadge) sidebarCountBadge.textContent = total;

    document.querySelectorAll('.app-filter-pill').forEach(pill => {
      const status = pill.getAttribute('data-status');
      const countSpan = pill.querySelector('.pill-count');
      if (countSpan) {
        if (status === 'all') countSpan.textContent = total;
        else if (status === 'submitted') countSpan.textContent = applications.filter(a => a.status === 'submitted' || a.status === 'pending').length;
        else if (status === 'viewed') countSpan.textContent = viewed;
        else if (status === 'interview') countSpan.textContent = interview;
        else if (status === 'offer') countSpan.textContent = offer;
        else if (status === 'rejected') countSpan.textContent = applications.filter(a => a.status === 'rejected').length;
        else if (status === 'withdrawn') countSpan.textContent = applications.filter(a => a.status === 'withdrawn').length;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. HIỂN THỊ DANH SÁCH ĐƠN ỨNG TUYỂN VỚI STEPPER 4 BƯỚC (WIREFRAME 5.4)
  // --------------------------------------------------------------------------
  function renderApplications() {
    if (!applicationsContainer) return;

    const filtered = applications.filter(app => {
      let matchStatus = true;
      if (currentFilter === 'submitted') matchStatus = (app.status === 'submitted' || app.status === 'pending');
      else if (currentFilter === 'viewed') matchStatus = (app.status === 'viewed');
      else if (currentFilter === 'interview') matchStatus = (app.status === 'interview');
      else if (currentFilter === 'offer') matchStatus = (app.status === 'offer' || app.status === 'accepted');
      else if (currentFilter === 'rejected') matchStatus = (app.status === 'rejected');
      else if (currentFilter === 'withdrawn') matchStatus = (app.status === 'withdrawn');

      let matchKeyword = true;
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase();
        const searchable = `${escapeHtml(app.jobTitle)} ${escapeHtml(app.company)} ${app.salary || ''} ${app.location || ''}`.toLowerCase();
        matchKeyword = searchable.includes(kw);
      }

      return matchStatus && matchKeyword;
    });

    if (filtered.length === 0) {
      applicationsContainer.innerHTML = `
        <div class="candidate-empty-state">
          <div class="empty-state-icon"><i class="fa-regular fa-folder-open" style="color: var(--color-primary);"></i></div>
          <h3 class="empty-state-title">Không tìm thấy đơn ứng tuyển nào!</h3>
          <p class="empty-state-desc">
            ${searchKeyword ? `Không có kết quả khớp với từ khóa "${searchKeyword}". Hãy thử tìm kiếm từ khóa khác.` : 'Bạn chưa có hồ sơ nào ở danh mục này. Hãy tiếp tục ứng tuyển các vị trí việc làm đang mở!'}
          </p>
          <a href="./jobs.html" class="btn-primary" style="text-decoration: none;">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span>Khám Phá Việc Làm Ngay</span>
          </a>
        </div>
      `;
      return;
    }

    applicationsContainer.innerHTML = filtered.map(app => {
      const step = app.stepIndex || 1;
      const isRejected = (app.status === 'rejected');
      const isOffer = (app.status === 'offer' || app.status === 'accepted');
      const isWithdrawn = (app.status === 'withdrawn');

      let badgeHtml = '';
      if (app.status === 'submitted' || app.status === 'pending') {
        badgeHtml = '<span class="status-badge" style="background:#dbeafe; color:#1e40af;"><i class="fa-regular fa-paper-plane"></i> Đã nộp đơn</span>';
      } else if (app.status === 'viewed') {
        badgeHtml = '<span class="status-badge" style="background:#e0f2fe; color:#0369a1;"><i class="fa-regular fa-eye"></i> Đã xem hồ sơ</span>';
      } else if (app.status === 'interview') {
        badgeHtml = '<span class="status-badge" style="background:#fef3c7; color:#b45309;"><i class="fa-regular fa-calendar-check"></i> Hẹn phỏng vấn</span>';
      } else if (isOffer) {
        badgeHtml = '<span class="status-badge" style="background:#ecfdf5; color:#065f46;"><i class="fa-solid fa-award"></i> Trúng tuyển</span>';
      } else if (isRejected) {
        badgeHtml = '<span class="status-badge" style="background:#fee2e2; color:#b91c1c;"><i class="fa-solid fa-circle-xmark"></i> Chưa phù hợp</span>';
      } else if (isWithdrawn) {
        badgeHtml = '<span class="status-badge" style="background:#f1f5f9; color:#475569;"><i class="fa-solid fa-ban"></i> Đã rút đơn</span>';
      }

      const appliedDateStr = String(app.appliedAt || '').slice(0, 10) || 'Hôm nay';
      const step1Date = (app.timeline && app.timeline.step1 && app.timeline.step1.date) || appliedDateStr;
      const step2Date = (app.timeline && app.timeline.step2 && app.timeline.step2.date) || (step >= 2 ? (app.viewedAt ? String(app.viewedAt).slice(0, 10) : 'Đã xem') : 'Chờ duyệt');
      const step3Date = (app.timeline && app.timeline.step3 && app.timeline.step3.date) || (step >= 3 ? 'Đã xếp lịch' : 'Chờ xét');
      const step4Date = (app.timeline && app.timeline.step4 && app.timeline.step4.date) || (isWithdrawn ? 'Đã rút đơn' : (isOffer ? 'Trúng tuyển' : (isRejected ? 'Từ chối' : 'Đang đánh giá')));

      return `
        <article class="application-card status-${app.status}" data-id="${app.id}">
          <div class="app-card-header">
            <div class="app-job-info">
              <div class="app-company-logo" style="background: #ffffff; color: ${app.companyLogoBg || '#1e40af'}; border: 1px solid var(--color-border); overflow: hidden; padding: ${app.logoUrl ? '4px' : '0'};" aria-hidden="true">
                ${app.logoUrl
                  ? `<img src="${escapeHtml(app.logoUrl)}" alt="${escapeHtml(app.company)}" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';"><span style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center;">${app.companyLogo || app.company.charAt(0)}</span>`
                  : (app.companyLogo || app.company.charAt(0))}
              </div>
              <div class="app-job-details">
                <h2>
                  <a href="./job-detail.html?id=${encodeURIComponent(app.jobId)}">${escapeHtml(app.jobTitle)}</a>
                </h2>
                <div class="app-job-subinfo">
                  <span><i class="fa-regular fa-building" aria-hidden="true"></i> <strong>${escapeHtml(app.company)}</strong></span>
                  <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escapeHtml(app.location || 'TP.HCM')}</span>
                  <span><i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> <strong>${app.salary || 'Thỏa thuận'}</strong></span>
                </div>
              </div>
            </div>
            <div>
              ${badgeHtml}
            </div>
          </div>

          <div class="app-snapshot-strip">
            <div class="snapshot-file-badge">
              <i class="fa-solid fa-file-pdf" style="color: var(--color-danger);"></i>
              <span>Bản chụp CV bất biến: <strong>${app.fileName || 'CV_Snapshot.pdf'}</strong> (${app.fileSize || 'PDF'})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="color: var(--color-muted); font-size: 0.8rem;"><i class="fa-regular fa-clock" aria-hidden="true"></i> Nộp lúc: <strong>${app.appliedAt}</strong></span>
              <button type="button" class="btn-outline btn-sm btn-download-snapshot" data-file="${app.fileName || 'CV.pdf'}" data-url="${app.snapshotUrl || ''}" title="Mở bản chụp CV này">
                <i class="fa-solid fa-file-lines"></i> Xem CV
              </button>
            </div>
          </div>

          <!-- STEPPER 4 BƯỚC RECRUITMENT -->
          <div class="stepper-timeline-box" aria-label="Tiến trình tuyển dụng 4 bước">
            <div class="stepper-timeline-header">
              <span>TIẾN TRÌNH TUYỂN DỤNG THEO THỜI GIAN THỰC</span>
              <span>BƯỚC ${step}/4</span>
            </div>

            <div class="stepper-track">
              <!-- BƯỚC 1 -->
              <div class="step-node ${step >= 1 ? 'completed' : 'pending'}">
                <div class="step-icon-bubble">
                  ${step >= 1 ? '<i class="fa-solid fa-check"></i>' : '1'}
                </div>
                <div class="step-label-title">1. ĐÃ NỘP ĐƠN</div>
                <div class="step-label-desc">${step1Date}</div>
              </div>

              <div class="step-line ${step >= 2 ? 'completed' : (step === 1 ? 'active' : '')}"></div>

              <!-- BƯỚC 2 -->
              <div class="step-node ${step > 2 ? 'completed' : (step === 2 ? 'active' : 'pending')}">
                <div class="step-icon-bubble">
                  ${step > 2 ? '<i class="fa-solid fa-check"></i>' : '2'}
                </div>
                <div class="step-label-title">2. ĐÃ XEM CV</div>
                <div class="step-label-desc">${step2Date}</div>
              </div>

              <div class="step-line ${step >= 3 ? 'completed' : (step === 2 ? 'active' : '')}"></div>

              <!-- BƯỚC 3 -->
              <div class="step-node ${step > 3 ? 'completed' : (step === 3 ? 'active' : 'pending')}">
                <div class="step-icon-bubble">
                  ${step > 3 ? '<i class="fa-solid fa-check"></i>' : '3'}
                </div>
                <div class="step-label-title">3. HẸN PHỎNG VẤN</div>
                <div class="step-label-desc">${step3Date}</div>
              </div>

              <div class="step-line ${step >= 4 ? (isRejected ? 'rejected' : 'completed') : (step === 3 ? 'active' : '')}"></div>

              <!-- BƯỚC 4 -->
              <div class="step-node ${isWithdrawn ? 'withdrawn' : (isOffer ? 'completed' : (isRejected ? 'rejected' : (step === 4 ? 'active' : 'pending')))}">
                <div class="step-icon-bubble">
                  ${isWithdrawn ? '<i class="fa-solid fa-ban"></i>' : (isOffer ? '<i class="fa-solid fa-award"></i>' : (isRejected ? '<i class="fa-solid fa-xmark"></i>' : '4'))}
                </div>
                <div class="step-label-title">${isWithdrawn ? '4. ĐÃ RÚT ĐƠN' : '4. KẾT QUẢ'}</div>
                <div class="step-label-desc">${isWithdrawn ? 'Đã hủy quy trình' : step4Date}</div>
              </div>
            </div>
          </div>

          ${app.feedback || isWithdrawn ? `
            <div class="app-feedback-box ${isWithdrawn ? 'feedback-withdrawn' : (isOffer ? 'feedback-offer' : (isRejected ? 'feedback-rejected' : 'feedback-interview'))}" style="${isWithdrawn ? 'background:#f8fafc; border:1px solid #cbd5e1; color:#475569;' : ''}">
              <i class="${isWithdrawn ? 'fa-solid fa-circle-info' : (isOffer ? 'fa-solid fa-trophy' : (isRejected ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-bullhorn'))}" style="font-size: 1.2rem; flex-shrink: 0; margin-top: 2px;"></i>
              <div>
                <strong>${isWithdrawn ? 'Thông tin tiến trình:' : `Thông báo từ Nhà Tuyển Dụng (${escapeHtml(app.company)}):`}</strong>
                <p style="margin: 4px 0 0; line-height: 1.5;">${isWithdrawn ? 'Bạn đã chủ động rút đơn ứng tuyển cho vị trí này. Đơn ứng tuyển được lưu trữ trong lịch sử hồ sơ của bạn.' : app.feedback}</p>
              </div>
            </div>
          ` : ''}

          <div class="app-card-actions">
            <div class="app-card-btn-group">
              <a href="./job-detail.html?id=${encodeURIComponent(app.jobId)}" class="btn-outline btn-sm">
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

            ${!isOffer && !isRejected && !isWithdrawn ? `
              <div>
                <button type="button" class="btn-delete-item btn-withdraw-app" data-id="${app.id}" title="Hủy bỏ đơn ứng tuyển này">
                  <i class="fa-solid fa-trash-can"></i> Rút đơn ứng tuyển
                </button>
              </div>
            ` : (isWithdrawn ? `
              <div>
                <span style="font-size:0.8rem; color:#64748b; font-weight:600; padding:6px 12px; background:#f1f5f9; border-radius:6px; display:inline-flex; align-items:center; gap:6px;">
                  <i class="fa-solid fa-ban"></i> Đã rút hồ sơ
                </span>
              </div>
            ` : '')}
          </div>
        </article>
      `;
    }).join('');

    attachCardEventListeners();
  }

  // --------------------------------------------------------------------------
  // 5. GẮN SỰ KIỆN TƯƠNG TÁC
  // --------------------------------------------------------------------------
  function attachCardEventListeners() {
    // 1. Mở xem tệp bản chụp CV qua header Authorization (không lộ token trên URL)
    applicationsContainer.querySelectorAll('.btn-download-snapshot').forEach(btn => {
      btn.addEventListener('click', async function () {
        const file = this.getAttribute('data-file') || 'CV.pdf';
        const url = this.getAttribute('data-url');
        if (url && typeof UI.openSecurePdf === 'function') {
          try {
            await UI.openSecurePdf(url, file);
          } catch (err) {
            if (window.showToast) window.showToast(err?.message || 'Không thể mở tệp CV.', 'error');
          }
        } else if (window.showToast) {
          window.showToast(`Đang tải tệp bản chụp: ${file}...`, 'info');
        }
      });
    });

    // 2. Rút đơn ứng tuyển qua REST API (Cập nhật trạng thái 'withdrawn' để lưu giữ lịch sử)
    applicationsContainer.querySelectorAll('.btn-withdraw-app').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const item = applications.find(a => String(a.id) === String(id));
        const jobTitle = item ? item.jobTitle : 'vị trí này';

        openCandConfirm(
          'Xác nhận rút đơn ứng tuyển',
          `Bạn có chắc chắn muốn rút đơn ứng tuyển cho "${jobTitle}" không? Hành động này sẽ hủy tiến trình tuyển dụng và không thể hoàn tác.`,
          async () => {
            if (!hasAuth()) {
              if (window.showToast) window.showToast('Vui lòng đăng nhập để rút đơn trên máy chủ.', 'warning');
              return;
            }
            if (!isNaN(Number(id))) {
              const originalText = btn.innerHTML;
              try {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang rút...';
                await API.delete(`/candidate/applications/${id}`);
                const target = applications.find(a => String(a.id) === String(id));
                if (target) {
                  target.status = 'withdrawn';
                  target.statusText = 'Đã rút đơn';
                }
                updateKPIs();
                renderApplications();

                if (window.showToast) {
                  window.showToast(`Đã rút đơn ứng tuyển vị trí "${jobTitle}" thành công. Đơn được lưu vào lịch sử.`, 'warning');
                }
              } catch (err) {
                console.warn('[API] Lỗi rút đơn:', err.message);
                if (window.showToast) {
                  window.showToast('Lỗi rút đơn ứng tuyển: ' + (err.message || 'Không thể rút đơn trên máy chủ'), 'error');
                }
                btn.disabled = false;
                btn.innerHTML = originalText;
              }
            }
          }
        );
      });
    });

    // 3. Xem lịch phỏng vấn
    applicationsContainer.querySelectorAll('.btn-view-interview').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const item = applications.find(a => String(a.id) === String(id));
        if (item && item.interviewInfo) {
          openInterviewModal(item);
        }
      });
    });

    // 4. Xem thư giới thiệu
    applicationsContainer.querySelectorAll('.btn-view-letter').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const item = applications.find(a => String(a.id) === String(id));
        if (item) {
          openCoverLetterModal(item);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 6. MODAL PHỎNG VẤN & THƯ GIỚI THIỆU
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
    const info = app.interviewInfo || {};

    if (modalJobTitle) modalJobTitle.textContent = app.jobTitle;
    if (modalCompany) modalCompany.textContent = app.company;
    if (modalTime) modalTime.textContent = info.time || 'Đang cập nhật';
    if (modalFormat) modalFormat.textContent = info.format || 'Trực tuyến';
    if (modalPlatform) modalPlatform.textContent = info.platform || 'Google Meet / MS Teams';
    if (modalLink) {
      modalLink.href = info.meetingLink || '#';
      modalLink.textContent = info.meetingLink || 'Nhấn để vào phòng họp';
    }
    if (modalInterviewers) modalInterviewers.textContent = info.interviewers || 'Hội đồng tuyển dụng';
    if (modalNote) modalNote.textContent = info.note || 'Vui lòng tham gia đúng giờ.';

    modalBackdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeInterviewModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeInterviewModal);
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) closeInterviewModal();
    });
  }

  const letterModal = document.getElementById('letterModal');
  const letterJobTitle = document.getElementById('letterJobTitle');
  const letterContent = document.getElementById('letterContent');
  const btnCloseLetter = document.getElementById('btnCloseLetterModal');

  function openCoverLetterModal(app) {
    if (!letterModal) return;
    if (letterJobTitle) letterJobTitle.textContent = `${escapeHtml(app.jobTitle)} — ${escapeHtml(app.company)}`;
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
  // 7. SỰ KIỆN TÌM KIẾM & BỘ LỌC TABS
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
  // 8. ĐỒNG BỘ DỮ LIỆU TỪ BACKEND MYSQL
  // --------------------------------------------------------------------------
  async function syncApplicationsFromBackend() {
    if (!hasAuth()) {
      updateKPIs();
      renderApplications();
      return;
    }

    try {
      const res = await API.get('/candidate/applications');
      if (res && Array.isArray(res.data)) {
        const stepMap = {
          pending: { index: 1, key: 'submitted', text: 'Đã nộp đơn' },
          submitted: { index: 1, key: 'submitted', text: 'Đã nộp đơn' },
          viewed: { index: 2, key: 'viewed', text: 'Doanh nghiệp đã xem' },
          interview: { index: 3, key: 'interview', text: 'Hẹn phỏng vấn' },
          accepted: { index: 4, key: 'offer', text: 'Trúng tuyển / Đã gửi Offer' },
          offer: { index: 4, key: 'offer', text: 'Trúng tuyển / Đã gửi Offer' },
          rejected: { index: 4, key: 'rejected', text: 'Chưa phù hợp' },
          withdrawn: { index: 1, key: 'withdrawn', text: 'Đã rút đơn' }
        };

        applications = res.data.map(item => {
          const conf = stepMap[item.status] || stepMap.pending;
          const salaryStr = (item.salary_min && item.salary_max)
            ? `${Math.round(item.salary_min / 1e6)} - ${Math.round(item.salary_max / 1e6)} Triệu`
            : 'Thương lượng';
          const rawLogo = item.logo_url || '';
          const logoUrl = rawLogo.startsWith('/assets/')
            ? `.${rawLogo}`
            : (rawLogo.startsWith('assets/') ? `./${rawLogo}` : rawLogo);

          return {
            id: item.application_id,
            jobId: item.job_id,
            jobTitle: item.job_title,
            company: item.company_name,
            companyLogo: (item.company_name || 'C').charAt(0),
            logoUrl,
            salary: salaryStr,
            location: item.location_name || 'TP.HCM',
            applicantName: currentUserName,
            applicantEmail: currentUserEmail,
            fileName: item.resume_snapshot_url ? item.resume_snapshot_url.split('/').pop() : 'CV_Snapshot.pdf',
            snapshotUrl: item.resume_snapshot_url,
            coverLetter: item.cover_letter,
            appliedAt: new Date(item.applied_at).toLocaleString('vi-VN'),
            viewedAt: item.viewed_at ? new Date(item.viewed_at).toLocaleString('vi-VN') : null,
            status: conf.key,
            statusText: conf.text,
            stepIndex: conf.index,
            timeline: {
              step1: { title: '1. ĐÃ NỘP ĐƠN', date: new Date(item.applied_at).toLocaleDateString('vi-VN'), completed: true },
              step2: { title: '2. DOANH NGHIỆP ĐÃ XEM', date: item.viewed_at ? new Date(item.viewed_at).toLocaleDateString('vi-VN') : (conf.index >= 2 ? 'Đã xem' : 'Chờ duyệt'), completed: conf.index >= 2 },
              step3: { title: '3. HẸN PHỎNG VẤN', date: conf.index >= 3 ? 'Đã xếp lịch' : 'Chờ xét', completed: conf.index >= 3 },
              step4: { title: '4. KẾT QUẢ CUỐI CÙNG', date: conf.key === 'offer' ? 'Trúng tuyển' : (conf.key === 'rejected' ? 'Từ chối' : 'Đang duyệt'), completed: conf.index >= 4 }
            },
            feedback: conf.key === 'offer'
              ? `Chúc mừng bạn! ${item.company_name} trân trọng thông báo bạn đã trúng tuyển vị trí này.`
              : (conf.key === 'interview'
                ? `${item.company_name} đã lên lịch phỏng vấn với bạn.`
                : (conf.key === 'viewed'
                  ? `Bộ phận Nhân sự ${item.company_name} đã mở xem CV của bạn.`
                  : 'Hồ sơ đã gửi thành công và đang trong danh sách chờ xét duyệt.')),
            interviewInfo: conf.key === 'interview' ? {
              time: item.interview_time ? new Date(item.interview_time).toLocaleString('vi-VN') : 'Nhà tuyển dụng sẽ xác nhận thời gian cụ thể qua Email/SĐT',
              format: item.interview_format || 'Phỏng vấn trực tiếp / Trực tuyến',
              platform: item.interview_platform || (item.location_name ? `Văn phòng ${item.company_name} (${item.location_name})` : `Phòng tuyển dụng ${item.company_name}`),
              link: item.interview_link || '',
              interviewers: item.interviewers || `Bộ phận Nhân sự & Quản lý chuyên môn - ${item.company_name}`,
              note: item.interview_note || `Vui lòng chuẩn bị CV và sẵn sàng trao đổi cho vị trí ${item.job_title}.`
            } : null
          };
        });
      }
    } catch (err) {
      console.warn('[MY APPLICATIONS] Đồng bộ API:', err.message);
    }

    updateKPIs();
    renderApplications();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      openCandConfirm(
        'Đăng xuất tài khoản',
        'Bạn có chắc chắn muốn đăng xuất khỏi JobPortal?',
        function () {
          if (API && typeof API.clearAuthSession === 'function') {
            API.clearAuthSession();
          } else {
            localStorage.removeItem('jobportal_access_token');
            localStorage.removeItem(SESSION_KEY);
          }
          if (window.showToast) window.showToast('Đã đăng xuất thành công!', 'info');
          setTimeout(() => { window.location.href = './index.html'; }, 500);
        }
      );
    });
  }

  syncApplicationsFromBackend();
});
