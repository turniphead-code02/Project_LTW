/**
 * ==========================================================================
 * MODULE: DANH SÁCH VIỆC LÀM ĐÃ LƯU (SAVED JOBS & BOOKMARKS MANAGEMENT)
 * --------------------------------------------------------------------------
 * Học phần: Lập trình Website — GVHD: ThS. Trần Thịnh Mạnh Đức — Nhóm 6 UTH
 * Sinh viên phụ trách: Nguyễn Phú Quang (MSSV: 036206029474)
 * Thiết kế chuẩn mực: Wireframe Phân Hệ Ứng Viên & Đồng bộ hệ thống JobPortal
 * 
 * PHẠM VI CHỨC NĂNG:
 *   1. Quản lý danh sách việc làm đã lưu (Đồng bộ MySQL qua /api/v1/candidate/saved-jobs)
 *   2. Đồng bộ trạng thái nộp đơn với đơn ứng tuyển (jobportal_applied_jobs)
 *   3. Bộ đếm chỉ số KPI thống kê việc làm đã lưu: Tổng số, Đang mở, Sắp hết hạn, Đã nộp
 *   4. Bộ lọc đa tiêu chí: Tìm kiếm từ khóa, Lọc theo khu vực, Hình thức, Tab nhanh
 *   5. Sắp xếp thông minh: Mới lưu gần đây, Lương cao nhất, Hạn nộp gần nhất
 *   6. Thao tác Bỏ lưu từng công việc & Xóa toàn bộ danh sách kèm Modal xác nhận an toàn
 *   7. Cập nhật Badge số lượng thời gian thực trên thanh điều hướng Sidebar
 *   8. Cơ chế Graceful Fallback đảm bảo giao diện luôn mượt mà cả khi offline
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const API = window.JobPortalAPI;

  const STORAGE_KEYS = {
    BOOKMARKS: 'jobportal_bookmarks',
    APPLICATIONS: 'jobportal_applied_jobs',
    SESSION: 'jobportal_session'
  };

  function hasAuth() {
    return Boolean(API && typeof API.getToken === 'function' && API.getToken());
  }

  // Bảo vệ phân quyền trang Ứng viên (Client-side RBAC Guard)
  (function enforceCandidateRole() {
    try {
      const token = (API && API.getToken && API.getToken()) || localStorage.getItem('jobportal_access_token');
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
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

  function getStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('Lỗi đọc localStorage:', key, e);
      return fallback;
    }
  }

  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Lỗi ghi localStorage:', key, e);
    }
  }

  function notify(msg, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      console.log(`[Toast ${type}]:`, msg);
    }
  }

  // --------------------------------------------------------------------------
  // 2. KHO DỮ LIỆU VIỆC LÀM CHUẨN CỦA HỆ THỐNG JOBPORTAL
  // --------------------------------------------------------------------------
  let ALL_JOBS_DB = [
    {
      id: 'job-01',
      title: 'Frontend React Developer (Junior / Middle)',
      company: 'Công Ty Cổ Phần Công Nghệ VNG',
      logo: 'VNG',
      logoBg: '#ea580c',
      verified: true,
      salary: '15 - 22 Triệu',
      salaryNum: 22,
      location: 'hcm',
      locationLabel: 'Quận 7, TP.HCM',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '1-3',
      experienceLabel: '1 - 3 năm',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['React', 'TypeScript', 'Redux Toolkit', 'TailwindCSS'],
      postedText: 'Hôm nay',
      postedDaysAgo: 0,
      deadlineText: '25/11/2026',
      deadlineDaysLeft: 16,
      isHot: true,
      isUrgent: true,
      description: 'Phát triển giao diện ứng dụng Zalo Web & Zalo Mini App. Tối ưu hiệu năng tải trang Web Vitals và thiết kế Responsive đạt chuẩn WCAG.'
    },
    {
      id: 'job-02',
      title: 'Junior Backend Node.js / NestJS Engineer',
      company: 'FPT Software Global',
      logo: 'FPT',
      logoBg: '#0284c7',
      verified: true,
      salary: '14 - 20 Triệu',
      salaryNum: 20,
      location: 'hcm',
      locationLabel: 'TP. Thủ Đức, TP.HCM',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '1-3',
      experienceLabel: '1 - 2 năm',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['Node.js', 'NestJS', 'PostgreSQL', 'Docker', 'Redis'],
      postedText: '1 ngày trước',
      postedDaysAgo: 1,
      deadlineText: '30/11/2026',
      deadlineDaysLeft: 21,
      isHot: true,
      isUrgent: false,
      description: 'Xây dựng hệ thống RESTful API & Microservices cho khách hàng Nhật Bản. Viết Unit test với Jest và quản lý CI/CD pipeline.'
    },
    {
      id: 'job-03',
      title: 'Thực Tập Sinh Lập Trình Java / Spring Boot (Có Phụ Cấp)',
      company: 'Viettel Solutions (Tập Đoàn Viễn Thông Quân Đội)',
      logo: 'VT',
      logoBg: '#b91c1c',
      verified: true,
      salary: '6 - 8 Triệu (Hỗ trợ)',
      salaryNum: 8,
      location: 'hanoi',
      locationLabel: 'Cầu Giấy, Hà Nội',
      workType: 'internship',
      workTypeLabel: 'Thực tập sinh',
      experience: 'fresher',
      experienceLabel: 'Dưới 1 năm / Fresher',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['Java', 'Spring Boot', 'MySQL', 'Git'],
      postedText: 'Hôm qua',
      postedDaysAgo: 1,
      deadlineText: '15/12/2026',
      deadlineDaysLeft: 36,
      isHot: false,
      isUrgent: true,
      description: 'Chương trình đào tạo Talent Internship dành cho sinh viên năm 3, năm 4 khối CNTT. Cơ hội lên nhân viên chính thức sau 3 tháng.'
    },
    {
      id: 'job-04',
      title: 'Chuyên Viên Phân Tích Dữ Liệu (Data Analyst)',
      company: 'MoMo (Công Ty Cổ Phần Dịch Vụ Di Động Trực Tuyến)',
      logo: 'MM',
      logoBg: '#9d174d',
      verified: true,
      salary: '16 - 24 Triệu',
      salaryNum: 24,
      location: 'hcm',
      locationLabel: 'Quận 7, TP.HCM',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '1-3',
      experienceLabel: '1 - 3 năm',
      category: 'data-ai',
      categoryLabel: 'Dữ liệu & AI',
      tags: ['SQL', 'Python', 'Power BI', 'Data Modeling', 'Tableau'],
      postedText: '2 ngày trước',
      postedDaysAgo: 2,
      deadlineText: '20/11/2026',
      deadlineDaysLeft: 11,
      isHot: true,
      isUrgent: false,
      description: 'Khai phá và trực quan hóa dữ liệu hành vi người dùng ứng dụng MoMo. Xây dựng Dashboard báo cáo quản trị KPI phục vụ ban giám đốc.'
    },
    {
      id: 'job-05',
      title: 'UI/UX Product Designer (Mobile & Web App)',
      company: 'Shopee Vietnam',
      logo: 'SP',
      logoBg: '#c2410c',
      verified: true,
      salary: '18 - 28 Triệu',
      salaryNum: 28,
      location: 'hcm',
      locationLabel: 'Quận 1, TP.HCM',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '1-3',
      experienceLabel: '2+ năm',
      category: 'design',
      categoryLabel: 'Thiết kế UI/UX',
      tags: ['Figma', 'Design System', 'Wireframing', 'User Research', 'Prototyping'],
      postedText: '3 ngày trước',
      postedDaysAgo: 3,
      deadlineText: '28/11/2026',
      deadlineDaysLeft: 19,
      isHot: false,
      isUrgent: false,
      description: 'Thiết kế trải nghiệm người dùng luồng thanh toán và giỏ hàng sàn TMĐT. Xây dựng bộ Design System và phối hợp với đội ngũ Kỹ sư Frontend.'
    },
    {
      id: 'job-06',
      title: 'DevOps & Cloud Engineer (AWS / Kubernetes)',
      company: 'KMS Technology Vietnam',
      logo: 'KMS',
      logoBg: '#047857',
      verified: true,
      salary: '25 - 38 Triệu',
      salaryNum: 38,
      location: 'danang',
      locationLabel: 'Hải Châu, Đà Nẵng',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '3-5',
      experienceLabel: '3 - 5 năm',
      category: 'cloud-devops',
      categoryLabel: 'Cloud & DevOps',
      tags: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD Jenkins'],
      postedText: '3 ngày trước',
      postedDaysAgo: 3,
      deadlineText: '05/12/2026',
      deadlineDaysLeft: 26,
      isHot: true,
      isUrgent: true,
      description: 'Quản trị hạ tầng Cloud AWS quy mô lớn cho đối tác Mỹ. Tự động hóa quy trình triển khai phần mềm không gián đoạn Zero-Downtime Deployment.'
    }
  ];

  // --------------------------------------------------------------------------
  // 3. KHỞI TẠO DANH SÁCH VIỆC LÀM ĐÃ LƯU
  // --------------------------------------------------------------------------
  const rawBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  let bookmarkedIds;

  if (rawBookmarks === null) {
    bookmarkedIds = ['job-01', 'job-04', 'job-05'];
    setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);
  } else {
    try {
      bookmarkedIds = JSON.parse(rawBookmarks);
      if (!Array.isArray(bookmarkedIds)) bookmarkedIds = [];
    } catch (e) {
      bookmarkedIds = [];
    }
  }

  const appliedList = getStorage(STORAGE_KEYS.APPLICATIONS, []);
  const appliedJobIds = new Set(appliedList.map(app => String(app.jobId || app.job_id)));

  const session = getStorage(STORAGE_KEYS.SESSION, null);
  const currentUserName = (session && (session.fullName || session.name)) || 'Nguyễn Phú Quang';

  const headerUserName = document.getElementById('headerUserName');
  const sidebarUserName = document.getElementById('sidebarUserName');
  if (headerUserName) headerUserName.textContent = currentUserName;
  if (sidebarUserName) sidebarUserName.textContent = currentUserName;

  // --------------------------------------------------------------------------
  // 4. BIẾN TRẠNG THÁI BỘ LỌC & DOM ELEMENTS
  // --------------------------------------------------------------------------
  let currentKeyword = '';
  let currentLocation = 'all';
  let currentWorkType = 'all';
  let currentSort = 'default';
  let currentQuickFilter = 'all';

  const savedJobsListEl = document.getElementById('savedJobsList');
  const emptyStateBox = document.getElementById('emptyStateBox');
  const emptyStateTitle = document.getElementById('emptyStateTitle');
  const emptyStateDesc = document.getElementById('emptyStateDesc');
  const emptyStateCta = document.getElementById('emptyStateCta');
  const savedCountEl = document.getElementById('savedCount');

  const searchInput = document.getElementById('savedSearchInput');
  const locationSelect = document.getElementById('savedLocationFilter');
  const workTypeSelect = document.getElementById('savedWorkTypeFilter');
  const sortSelect = document.getElementById('savedSortSelect');
  const quickPills = document.querySelectorAll('.app-filter-pill[data-filter]');

  const btnClearAll = document.getElementById('btnClearAllSaved');
  const clearModal = document.getElementById('clearModal');
  const btnCancelClear = document.getElementById('btnCancelClear');
  const btnConfirmClear = document.getElementById('btnConfirmClear');
  const btnCloseClearModal = document.getElementById('btnCloseClearModal');

  // --------------------------------------------------------------------------
  // 5. CẬP NHẬT CÁC CHỈ SỐ KPI VÀ BADGE SIDEBAR
  // --------------------------------------------------------------------------
  function updateKPIsAndBadges() {
    const savedJobs = ALL_JOBS_DB.filter(j => bookmarkedIds.map(String).includes(String(j.id)));

    const totalCount = savedJobs.length;
    const activeCount = totalCount;
    const expiringSoonCount = savedJobs.filter(j => (j.deadlineDaysLeft != null && j.deadlineDaysLeft <= 15)).length;
    const appliedCount = savedJobs.filter(j => appliedJobIds.has(String(j.id))).length;

    const statTotalEl = document.getElementById('statTotalSaved');
    const statActiveEl = document.getElementById('statActive');
    const statExpiringEl = document.getElementById('statExpiringSoon');
    const statAppliedEl = document.getElementById('statApplied');

    if (statTotalEl) statTotalEl.textContent = totalCount;
    if (statActiveEl) statActiveEl.textContent = activeCount;
    if (statExpiringEl) statExpiringEl.textContent = expiringSoonCount;
    if (statAppliedEl) statAppliedEl.textContent = appliedCount;

    const sidebarSaveBadge = document.getElementById('sidebarSaveCount');
    const sidebarAppBadge = document.getElementById('sidebarAppCount');

    if (sidebarSaveBadge) sidebarSaveBadge.textContent = totalCount;
    if (sidebarAppBadge) sidebarAppBadge.textContent = appliedList.length;

    const pillAllCount = document.getElementById('pillAllCount');
    const pillNotAppliedCount = document.getElementById('pillNotAppliedCount');
    const pillAppliedCount = document.getElementById('pillAppliedCount');
    const pillUrgentCount = document.getElementById('pillUrgentCount');

    if (pillAllCount) pillAllCount.textContent = totalCount;
    if (pillNotAppliedCount) pillNotAppliedCount.textContent = Math.max(0, totalCount - appliedCount);
    if (pillAppliedCount) pillAppliedCount.textContent = appliedCount;
    if (pillUrgentCount) pillUrgentCount.textContent = expiringSoonCount;
  }

  // --------------------------------------------------------------------------
  // 6. LỌC VÀ SẮP XẾP DANH SÁCH VIỆC LÀM ĐÃ LƯU
  // --------------------------------------------------------------------------
  function getFilteredJobs() {
    let list = ALL_JOBS_DB.filter(job => bookmarkedIds.map(String).includes(String(job.id)));

    if (currentKeyword.trim() !== '') {
      const q = currentKeyword.toLowerCase().trim();
      list = list.filter(job => {
        return (
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.tags && job.tags.some(tag => tag.toLowerCase().includes(q))) ||
          (job.description && job.description.toLowerCase().includes(q))
        );
      });
    }

    if (currentLocation !== 'all') {
      list = list.filter(job => job.location === currentLocation || (job.locationLabel && job.locationLabel.toLowerCase().includes(currentLocation.toLowerCase())));
    }

    if (currentWorkType !== 'all') {
      list = list.filter(job => job.workType === currentWorkType);
    }

    if (currentQuickFilter === 'not-applied') {
      list = list.filter(job => !appliedJobIds.has(String(job.id)));
    } else if (currentQuickFilter === 'applied') {
      list = list.filter(job => appliedJobIds.has(String(job.id)));
    } else if (currentQuickFilter === 'urgent') {
      list = list.filter(job => job.deadlineDaysLeft != null && job.deadlineDaysLeft <= 15);
    }

    if (currentSort === 'salary-desc') {
      list.sort((a, b) => (b.salaryNum || 0) - (a.salaryNum || 0));
    } else if (currentSort === 'deadline-asc') {
      list.sort((a, b) => (a.deadlineDaysLeft || 999) - (b.deadlineDaysLeft || 999));
    } else if (currentSort === 'default') {
      list.sort((a, b) => {
        return bookmarkedIds.map(String).indexOf(String(b.id)) - bookmarkedIds.map(String).indexOf(String(a.id));
      });
    }

    return list;
  }

  // --------------------------------------------------------------------------
  // 7. RENDER DANH SÁCH THẺ VIỆC LÀM
  // --------------------------------------------------------------------------
  function renderSavedJobs() {
    updateKPIsAndBadges();

    const filtered = getFilteredJobs();

    if (savedCountEl) {
      savedCountEl.textContent = filtered.length;
    }

    if (filtered.length === 0) {
      savedJobsListEl.style.display = 'none';
      emptyStateBox.style.display = 'flex';

      if (bookmarkedIds.length === 0) {
        emptyStateTitle.textContent = 'Bạn chưa lưu cơ hội việc làm nào!';
        emptyStateDesc.textContent = 'Khám phá hàng trăm tin tuyển dụng IT chất lượng trên JobPortal và bấm biểu tượng trái tim để lưu lại theo dõi.';
        if (emptyStateCta) {
          emptyStateCta.style.display = 'inline-flex';
          emptyStateCta.href = './jobs.html';
          emptyStateCta.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Khám phá việc làm ngay';
        }
      } else {
        emptyStateTitle.textContent = 'Không tìm thấy việc làm phù hợp!';
        emptyStateDesc.textContent = 'Không có công việc đã lưu nào khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại của bạn.';
        if (emptyStateCta) {
          emptyStateCta.style.display = 'inline-flex';
          emptyStateCta.href = '#';
          emptyStateCta.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Đặt lại bộ lọc';
          emptyStateCta.onclick = function (e) {
            e.preventDefault();
            resetFilters();
          };
        }
      }
      return;
    }

    savedJobsListEl.style.display = 'flex';
    emptyStateBox.style.display = 'none';

    savedJobsListEl.innerHTML = filtered.map(job => {
      const isApplied = appliedJobIds.has(String(job.id));
      const isUrgentDeadline = job.deadlineDaysLeft != null && job.deadlineDaysLeft <= 15;

      return `
        <article class="job-listing-item" data-id="${job.id}" style="position: relative;">
          <div class="job-item-header">
            <div style="display: flex; gap: 16px; align-items: flex-start;">
              <div class="company-logo-badge" style="background: #ffffff; color: ${job.logoBg || '#1e40af'}; border: 1px solid var(--color-border); width: 52px; height: 52px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.05rem; flex-shrink: 0; box-shadow: var(--shadow-sm); overflow: hidden; padding: ${job.logoUrl ? '4px' : '0'};">
                ${job.logoUrl
                  ? `<img src="${job.logoUrl}" alt="${job.company}" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.style.display='none'; if (this.nextElementSibling) this.nextElementSibling.style.display='flex';"><span style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center;">${job.logo || 'JP'}</span>`
                  : (job.logo || 'JP')}
              </div>

              <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                  <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-muted);"><i class="fa-regular fa-building" aria-hidden="true"></i> ${job.company}</span>
                  ${job.verified ? `
                    <span class="candidate-badge" style="background: #ecfdf5; color: #047857; font-size: 0.725rem; padding: 2px 8px;">
                      <i class="fa-solid fa-circle-check"></i> Đã xác thực
                    </span>
                  ` : ''}
                  ${job.isHot ? `
                    <span class="candidate-badge" style="background: #fef2f2; color: #b91c1c; font-size: 0.725rem; padding: 2px 8px;">
                      <i class="fa-solid fa-fire"></i> Tuyển gấp
                    </span>
                  ` : ''}
                </div>

                <h3 class="job-item-title" style="margin: 0; font-size: 1.15rem; font-weight: 700;">
                  <a href="./job-detail.html?id=${job.id}" style="color: var(--color-dark); text-decoration: none; transition: color 0.2s;">
                    ${job.title}
                  </a>
                </h3>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
              <span class="job-salary-pill" style="background: var(--color-accent-soft); color: #047857; border: 1px solid rgba(16,185,129,0.25); padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 0.95rem; white-space: nowrap;">
                <i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> ${job.salary}
              </span>

              <button 
                type="button" 
                class="btn-remove-saved" 
                data-id="${job.id}" 
                title="Bỏ lưu công việc này" 
                aria-label="Bỏ lưu ${job.title}"
                style="background: #ffffff; border: 1px solid var(--color-border); width: 36px; height: 36px; border-radius: 8px; font-size: 1rem; cursor: pointer; color: var(--color-primary); transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
              >
                <i class="fa-solid fa-bookmark"></i>
              </button>
            </div>
          </div>

          <p style="font-size: 0.9rem; color: var(--color-body); line-height: 1.55; margin: 4px 0 8px;">
            ${job.description || ''}
          </p>

          ${job.tags && job.tags.length ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
              ${job.tags.map(tag => `
                <span style="background: var(--color-bg-page); border: 1px solid var(--color-border); color: var(--color-dark); font-size: 0.775rem; padding: 3px 10px; border-radius: 6px; font-weight: 500;">
                  #${tag}
                </span>
              `).join('')}
            </div>
          ` : ''}

          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 0.85rem; color: var(--color-muted); padding-top: 8px; border-top: 1px dashed var(--color-border-light);">
            <span><i class="fa-solid fa-location-dot" style="color: var(--color-primary); margin-right: 4px;"></i> ${job.locationLabel || 'Toàn quốc'}</span>
            <span><i class="fa-regular fa-clock" style="color: var(--color-primary); margin-right: 4px;"></i> ${job.workTypeLabel || 'Toàn thời gian'}</span>
            <span><i class="fa-solid fa-briefcase" style="color: var(--color-primary); margin-right: 4px;"></i> ${job.experienceLabel || 'Có kinh nghiệm'}</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--color-border-light);">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span style="font-size: 0.825rem; font-weight: 600; color: ${isUrgentDeadline ? 'var(--color-danger)' : 'var(--color-muted)'}; display: flex; align-items: center; gap: 4px;">
                <i class="fa-regular fa-calendar-xmark"></i>
                Hạn nộp: ${job.deadlineText || 'Mở'} ${isUrgentDeadline ? `(Còn ${job.deadlineDaysLeft} ngày)` : ''}
              </span>

              ${isApplied ? `
                <span class="candidate-badge" style="background: #e0f2fe; color: #0284c7; font-size: 0.8rem; font-weight: 600; padding: 3px 10px;">
                  <i class="fa-solid fa-paper-plane"></i> Đã nộp hồ sơ
                </span>
              ` : `
                <span class="candidate-badge" style="background: #f1f5f9; color: #475569; font-size: 0.8rem; font-weight: 500; padding: 3px 10px;">
                  <i class="fa-regular fa-clock"></i> Chưa ứng tuyển
                </span>
              `}
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <a href="./job-detail.html?id=${job.id}" class="btn-outline btn-sm" style="text-decoration: none;">
                Xem Chi Tiết
              </a>

              <a href="./job-detail.html?id=${job.id}&apply=now" class="btn-primary btn-sm" style="text-decoration: none;">
                ${isApplied ? 'Xem Trạng Thái' : 'Ứng Tuyển Ngay'}
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachRemoveButtons();
  }

  // --------------------------------------------------------------------------
  // 8. BỎ LƯU TỪNG TIN QUA REST API
  // --------------------------------------------------------------------------
  function attachRemoveButtons() {
    const removeBtns = document.querySelectorAll('.btn-remove-saved');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        const jobId = this.getAttribute('data-id');
        const targetJob = ALL_JOBS_DB.find(j => String(j.id) === String(jobId));

        if (hasAuth()) {
          if (!isNaN(Number(jobId))) {
            try {
              btn.disabled = true;
              await API.delete(`/candidate/saved-jobs/${jobId}`);
              bookmarkedIds = bookmarkedIds.filter(id => String(id) !== String(jobId));
              setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);
              notify(`Đã bỏ lưu công việc "${targetJob ? targetJob.title : 'Việc làm'}" thành công.`, 'info');
              renderSavedJobs();
            } catch (err) {
              console.warn('[API] Lỗi bỏ lưu việc làm:', err.message);
              notify('Lỗi bỏ lưu việc làm: ' + (err.message || 'Không thể xóa trên máy chủ'), 'error');
              btn.disabled = false;
            }
          } else {
            notify('Mã việc làm không hợp lệ trên máy chủ.', 'warning');
          }
          return;
        }

        // Chế độ ngoại tuyến (chưa đăng nhập)
        bookmarkedIds = bookmarkedIds.filter(id => String(id) !== String(jobId));
        setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);

        notify(`Đã bỏ lưu công việc "${targetJob ? targetJob.title : 'Việc làm'}"`, 'info');
        renderSavedJobs();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 9. XÓA TẤT CẢ VIỆC LÀM ĐÃ LƯU
  // --------------------------------------------------------------------------
  if (btnClearAll) {
    btnClearAll.addEventListener('click', function () {
      if (bookmarkedIds.length === 0) {
        notify('Danh sách việc làm đã lưu hiện đang rỗng!', 'warning');
        return;
      }
      if (clearModal) {
        clearModal.classList.add('active');
      }
    });
  }

  function closeClearModal() {
    if (clearModal) {
      clearModal.classList.remove('active');
    }
  }

  if (btnCancelClear) btnCancelClear.addEventListener('click', closeClearModal);
  if (btnCloseClearModal) btnCloseClearModal.addEventListener('click', closeClearModal);

  if (clearModal) {
    clearModal.addEventListener('click', function (e) {
      if (e.target === clearModal) closeClearModal();
    });
  }

  if (btnConfirmClear) {
    btnConfirmClear.addEventListener('click', async function () {
      if (hasAuth()) {
        btnConfirmClear.disabled = true;
        btnConfirmClear.textContent = 'Đang xóa...';
        const failedIds = [];
        const successIds = [];

        for (const id of bookmarkedIds) {
          if (!isNaN(Number(id))) {
            try {
              await API.delete(`/candidate/saved-jobs/${id}`);
              successIds.push(id);
            } catch (err) {
              console.warn(`[API] Lỗi xóa việc làm #${id}:`, err.message);
              failedIds.push(id);
            }
          } else {
            successIds.push(id);
          }
        }

        btnConfirmClear.disabled = false;
        btnConfirmClear.textContent = 'Xác nhận xóa';

        // Chỉ xóa khỏi danh sách các ID đã xóa thành công trên máy chủ
        bookmarkedIds = bookmarkedIds.filter(id => !successIds.includes(id));
        setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);
        closeClearModal();
        renderSavedJobs();

        if (failedIds.length > 0) {
          notify(`Đã xóa ${successIds.length} việc làm. Còn ${failedIds.length} việc làm xóa thất bại trên máy chủ!`, 'warning');
        } else {
          notify('Đã xóa toàn bộ việc làm đã lưu khỏi danh sách thành công!', 'success');
        }
        return;
      }

      // Ngoại tuyến (chưa đăng nhập)
      bookmarkedIds = [];
      setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);
      closeClearModal();
      notify('Đã xóa toàn bộ việc làm đã lưu khỏi danh sách!', 'success');
      renderSavedJobs();
    });
  }

  // --------------------------------------------------------------------------
  // 10. XỬ LÝ TÌM KIẾM & BỘ LỌC
  // --------------------------------------------------------------------------
  function resetFilters() {
    currentKeyword = '';
    currentLocation = 'all';
    currentWorkType = 'all';
    currentSort = 'default';
    currentQuickFilter = 'all';

    if (searchInput) searchInput.value = '';
    if (locationSelect) locationSelect.value = 'all';
    if (workTypeSelect) workTypeSelect.value = 'all';
    if (sortSelect) sortSelect.value = 'default';

    quickPills.forEach(pill => {
      pill.classList.toggle('active', pill.dataset.filter === 'all');
    });

    renderSavedJobs();
  }

  let debounceTimeout = null;
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        currentKeyword = searchInput.value;
        renderSavedJobs();
      }, 250);
    });
  }

  if (locationSelect) {
    locationSelect.addEventListener('change', function () {
      currentLocation = this.value;
      renderSavedJobs();
    });
  }

  if (workTypeSelect) {
    workTypeSelect.addEventListener('change', function () {
      currentWorkType = this.value;
      renderSavedJobs();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      currentSort = this.value;
      renderSavedJobs();
    });
  }

  quickPills.forEach(pill => {
    pill.addEventListener('click', function () {
      quickPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentQuickFilter = this.dataset.filter;
      renderSavedJobs();
    });
  });

  // --------------------------------------------------------------------------
  // 11. ĐĂNG XUẤT
  // --------------------------------------------------------------------------
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi JobPortal?')) {
        if (API && typeof API.clearAuthSession === 'function') {
          API.clearAuthSession();
        } else {
          localStorage.removeItem(STORAGE_KEYS.SESSION);
        }
        notify('Đã đăng xuất thành công!', 'info');
        setTimeout(() => {
          window.location.href = './index.html';
        }, 500);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. ĐỒNG BỘ DỮ LIỆU TỪ BACKEND MYSQL
  // --------------------------------------------------------------------------
  async function syncSavedJobsFromBackend() {
    if (!hasAuth()) {
      renderSavedJobs();
      return;
    }

    try {
      const res = await API.get('/candidate/saved-jobs');
      if (res && Array.isArray(res.data)) {
        const dbJobs = res.data.map(item => {
          const salaryNum = item.salary_max ? Math.round(item.salary_max / 1e6) : 0;
          const salaryStr = (item.salary_min && item.salary_max)
            ? `${Math.round(item.salary_min / 1e6)} - ${Math.round(item.salary_max / 1e6)} Triệu`
            : 'Thương lượng';

          const daysLeft = item.deadline
            ? Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24))
            : 30;

          const rawLogo = item.logo_url || '';
          const logoUrl = rawLogo.startsWith('/assets/')
            ? `.${rawLogo}`
            : (rawLogo.startsWith('assets/') ? `./${rawLogo}` : rawLogo);

          return {
            id: String(item.job_id),
            title: item.title,
            company: item.company_name,
            logo: (item.company_name || 'C').charAt(0),
            logoUrl,
            logoBg: '#1e40af',
            verified: true,
            salary: salaryStr,
            salaryNum,
            location: item.location_name ? item.location_name.toLowerCase() : 'all',
            locationLabel: item.location_name || 'Toàn quốc',
            workType: item.employment_type || 'fulltime',
            workTypeLabel: item.employment_type === 'full_time' ? 'Toàn thời gian' : 'Linh hoạt',
            experience: item.experience_level || 'junior',
            experienceLabel: item.experience_level || 'Có kinh nghiệm',
            category: 'all',
            categoryLabel: 'Việc làm đa ngành',
            tags: [item.location_name || 'Toàn quốc', item.employment_type === 'full_time' ? 'Toàn thời gian' : 'Linh hoạt'],
            postedText: 'Gần đây',
            postedDaysAgo: 1,
            deadlineText: item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : 'Đang mở',
            deadlineDaysLeft: daysLeft,
            isHot: false,
            isUrgent: daysLeft <= 15,
            description: `${item.title} tại ${item.company_name}. Vị trí việc làm chất lượng cao.`
          };
        });

        // Hợp nhất việc làm từ MySQL vào ALL_JOBS_DB
        dbJobs.forEach(dj => {
          if (!ALL_JOBS_DB.some(j => String(j.id) === String(dj.id))) {
            ALL_JOBS_DB.unshift(dj);
          }
        });

        bookmarkedIds = dbJobs.map(j => String(j.id));
        setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);
      }
    } catch (err) {
      console.warn('[SAVED JOBS] Đồng bộ API:', err.message);
    }

    renderSavedJobs();
  }

  syncSavedJobsFromBackend();
});
