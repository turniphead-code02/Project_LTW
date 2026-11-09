/**
 * ==========================================================================
 * MODULE: DANH SÁCH VIỆC LÀM ĐÃ LƯU (SAVED JOBS & BOOKMARKS MANAGEMENT)
 * --------------------------------------------------------------------------
 * Học phần: Lập trình Website — GVHD: ThS. Trần Thịnh Mạnh Đức — Nhóm 6 UTH
 * Sinh viên phụ trách: Nguyễn Phú Quang (MSSV: 036206029474)
 * Thiết kế chuẩn mực: Wireframe Phân Hệ Ứng Viên & Đồng bộ hệ thống JobPortal
 * 
 * PHẠM VI CHỨC NĂNG:
 *   1. Quản lý danh sách việc làm đã lưu (Đọc/Ghi LocalStorage: jobportal_bookmarks)
 *   2. Đồng bộ trạng thái nộp đơn với đơn ứng tuyển (jobportal_applied_jobs)
 *   3. Bộ đếm chỉ số KPI thống kê việc làm đã lưu: Tổng số, Đang mở, Sắp hết hạn, Đã nộp
 *   4. Bộ lọc đa tiêu chí: Tìm kiếm từ khóa, Lọc theo khu vực, Hình thức, Tab nhanh
 *   5. Sắp xếp thông minh: Mới lưu gần đây, Lương cao nhất, Hạn nộp gần nhất
 *   6. Thao tác Bỏ lưu từng công việc & Xóa toàn bộ danh sách kèm Modal xác nhận an toàn
 *   7. Cập nhật Badge số lượng thời gian thực trên thanh điều hướng Sidebar
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CẤU HÌNH STORAGE KEYS & DỮ LIỆU PHIÊN ĐĂNG NHẬP
  // --------------------------------------------------------------------------
  const STORAGE_KEYS = {
    BOOKMARKS: 'jobportal_bookmarks',
    APPLICATIONS: 'jobportal_applied_jobs',
    SESSION: 'jobportal_session'
  };

  // Helper đọc LocalStorage an toàn
  function getStorage(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn('Lỗi đọc localStorage:', key, e);
      return fallback;
    }
  }

  // Helper ghi LocalStorage
  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Lỗi ghi localStorage:', key, e);
    }
  }

  // Hiển thị thông báo Toast
  function notify(msg, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      console.log(`[Toast ${type}]:`, msg);
    }
  }

  // --------------------------------------------------------------------------
  // 2. KHO DỮ LIỆU VIỆC LÀM CHUẨN CỦA HỆ THỐNG JOBPORTAL (12 JOBS IT MẪU)
  // --------------------------------------------------------------------------
  const ALL_JOBS_DB = [
    {
      id: 'job-01',
      title: 'Frontend React Developer (Junior / Middle)',
      company: 'Công Ty Cổ Phần Công Nghệ VNG',
      logo: 'VNG',
      logoBg: 'linear-gradient(135deg, #ff6b4a 0%, #ff8e53 100%)',
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
      logoBg: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
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
      logoBg: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
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
      logoBg: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)',
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
      logoBg: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
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
      logoBg: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
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
    },
    {
      id: 'job-07',
      title: 'Mobile Flutter Developer (Fintech App - Remote)',
      company: 'ZaloPay FinTech Group',
      logo: 'ZP',
      logoBg: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
      verified: true,
      salary: '20 - 32 Triệu',
      salaryNum: 32,
      location: 'remote',
      locationLabel: 'Làm từ xa (Remote 100%)',
      workType: 'remote',
      workTypeLabel: 'Làm việc từ xa',
      experience: '1-3',
      experienceLabel: '1 - 3 năm',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['Flutter', 'Dart', 'BLoC', 'REST API', 'Payment Gateway'],
      postedText: '4 ngày trước',
      postedDaysAgo: 4,
      deadlineText: '18/11/2026',
      deadlineDaysLeft: 9,
      isHot: false,
      isUrgent: false,
      description: 'Lập trình module thanh toán mã QR và tích hợp cổng thanh toán ngân hàng trực tuyến. Cho phép làm việc linh hoạt từ mọi tỉnh thành.'
    },
    {
      id: 'job-08',
      title: 'Kỹ Sư An Toàn Thông Tin & Giám Sát SOC (SecOps)',
      company: 'Tập Đoàn Bưu Chính Viễn Thông Việt Nam (VNPT IT)',
      logo: 'VNPT',
      logoBg: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
      verified: true,
      salary: '18 - 26 Triệu',
      salaryNum: 26,
      location: 'hanoi',
      locationLabel: 'Đống Đa, Hà Nội',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '1-3',
      experienceLabel: '1 - 3 năm',
      category: 'security',
      categoryLabel: 'An toàn thông tin',
      tags: ['SOC', 'SIEM', 'Network Security', 'Penetration Testing', 'Linux'],
      postedText: '4 ngày trước',
      postedDaysAgo: 4,
      deadlineText: '10/12/2026',
      deadlineDaysLeft: 31,
      isHot: false,
      isUrgent: false,
      description: 'Theo dõi, phân tích nhật ký log hệ thống mạng viễn thông quốc gia. Ứng phó sự cố an ninh mạng và rà quét lỗ hổng định kỳ theo chuẩn ISO 27001.'
    },
    {
      id: 'job-09',
      title: 'Fullstack Web Developer (.NET Core 8 & Angular)',
      company: 'Axon Active Vietnam',
      logo: 'AA',
      logoBg: 'linear-gradient(135deg, #b91c1c 0%, #f43f5e 100%)',
      verified: true,
      salary: '22 - 35 Triệu',
      salaryNum: 35,
      location: 'cantho',
      locationLabel: 'Ninh Kiều, Cần Thơ',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: '3-5',
      experienceLabel: '3+ năm',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['.NET Core', 'C#', 'Angular', 'SQL Server', 'Scrum Agile'],
      postedText: '5 ngày trước',
      postedDaysAgo: 5,
      deadlineText: '12/12/2026',
      deadlineDaysLeft: 33,
      isHot: true,
      isUrgent: false,
      description: 'Làm việc trong môi trường Scrum Thụy Sĩ tiêu chuẩn quốc tế. Giao tiếp tiếng Anh hàng ngày với khách hàng châu Âu.'
    },
    {
      id: 'job-10',
      title: 'Thực Tập Sinh Kiểm Thử Phần Mềm (QA / Manual Tester)',
      company: 'NashTech Vietnam',
      logo: 'NT',
      logoBg: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
      verified: true,
      salary: '5 - 7 Triệu (Trợ cấp)',
      salaryNum: 7,
      location: 'hcm',
      locationLabel: 'Tân Bình, TP.HCM',
      workType: 'internship',
      workTypeLabel: 'Thực tập sinh',
      experience: 'fresher',
      experienceLabel: 'Fresher / Sinh viên năm cuối',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['Manual Testing', 'Test Case', 'Postman', 'Jira', 'SQL'],
      postedText: '5 ngày trước',
      postedDaysAgo: 5,
      deadlineText: '22/11/2026',
      deadlineDaysLeft: 13,
      isHot: false,
      isUrgent: true,
      description: 'Viết tài liệu Test Plan, Test Case và báo cáo Bug trên Jira. Được Mentor kèm cặp 1-1 và cấp chứng nhận thực tập hoàn thành.'
    },
    {
      id: 'job-11',
      title: 'AI / Machine Learning Engineer (Fresher / Junior)',
      company: 'One Mount Group (Vingroup Tech)',
      logo: 'OM',
      logoBg: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
      verified: true,
      salary: '18 - 27 Triệu',
      salaryNum: 27,
      location: 'hanoi',
      locationLabel: 'Hai Bà Trưng, Hà Nội',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: 'fresher',
      experienceLabel: 'Fresher / 1 năm',
      category: 'data-ai',
      categoryLabel: 'Dữ liệu & AI',
      tags: ['Python', 'PyTorch', 'Computer Vision', 'NLP', 'TensorFlow'],
      postedText: '6 ngày trước',
      postedDaysAgo: 6,
      deadlineText: '01/12/2026',
      deadlineDaysLeft: 22,
      isHot: true,
      isUrgent: false,
      description: 'Tham gia nghiên cứu và ứng dụng mô hình Deep Learning cho hệ sinh thái VinID & VinShop. Xây dựng hệ thống gợi ý sản phẩm tự động.'
    },
    {
      id: 'job-12',
      title: 'Kỹ Sư Phần Mềm Nhúng (Embedded C/C++ Developer)',
      company: 'Renesas Design Vietnam',
      logo: 'RN',
      logoBg: 'linear-gradient(135deg, #334155 0%, #64748b 100%)',
      verified: true,
      salary: '13 - 18 Triệu',
      salaryNum: 18,
      location: 'hcm',
      locationLabel: 'Quận 7 (KCX Tân Thuận), TP.HCM',
      workType: 'fulltime',
      workTypeLabel: 'Toàn thời gian',
      experience: 'fresher',
      experienceLabel: 'Fresher / 1 năm',
      category: 'software',
      categoryLabel: 'Lập trình phần mềm',
      tags: ['C/C++', 'Microcontroller', 'RTOS', 'CAN Bus', 'Git'],
      postedText: '1 tuần trước',
      postedDaysAgo: 7,
      deadlineText: '20/12/2026',
      deadlineDaysLeft: 41,
      isHot: false,
      isUrgent: false,
      description: 'Phát triển Driver và Firmware nhúng trên vi điều khiển bán dẫn cho xe ô tô tự hành và thiết bị IoT. Cơ hội đào tạo tại Nhật Bản.'
    }
  ];

  // --------------------------------------------------------------------------
  // 3. KHỞI TẠO DANH SÁCH VIỆC LÀM ĐÃ LƯU TỪ LOCALSTORAGE
  // --------------------------------------------------------------------------
  const rawBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
  let bookmarkedIds;

  if (rawBookmarks === null) {
    // Khởi tạo 3 việc làm mẫu được yêu thích sẵn để giao diện trực quan và dễ chấm điểm đồ án
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

  // Đọc danh sách đơn đã nộp để kiểm tra trạng thái ứng tuyển chéo
  const appliedList = getStorage(STORAGE_KEYS.APPLICATIONS, []);
  const appliedJobIds = new Set(appliedList.map(app => app.jobId));

  // Đọc thông tin phiên đăng nhập
  const session = getStorage(STORAGE_KEYS.SESSION, null);
  const currentUserName = (session && (session.fullName || session.name)) || 'Nguyễn Phú Quang';

  // Hiển thị tên tài khoản lên Navbar và Sidebar
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
  let currentQuickFilter = 'all'; // 'all', 'not-applied', 'applied', 'urgent'

  const savedJobsListEl = document.getElementById('savedJobsList');
  const emptyStateBox = document.getElementById('emptyStateBox');
  const emptyStateTitle = document.getElementById('emptyStateTitle');
  const emptyStateDesc = document.getElementById('emptyStateDesc');
  const emptyStateCta = document.getElementById('emptyStateCta');
  const savedCountEl = document.getElementById('savedCount');

  // Input & Select Elements
  const searchInput = document.getElementById('savedSearchInput');
  const locationSelect = document.getElementById('savedLocationFilter');
  const workTypeSelect = document.getElementById('savedWorkTypeFilter');
  const sortSelect = document.getElementById('savedSortSelect');
  const quickPills = document.querySelectorAll('.app-filter-pill[data-filter]');

  // Modal Elements
  const btnClearAll = document.getElementById('btnClearAllSaved');
  const clearModal = document.getElementById('clearModal');
  const btnCancelClear = document.getElementById('btnCancelClear');
  const btnConfirmClear = document.getElementById('btnConfirmClear');
  const btnCloseClearModal = document.getElementById('btnCloseClearModal');

  // --------------------------------------------------------------------------
  // 5. CẬP NHẬT CÁC CHỈ SỐ KPI VÀ BADGE SIDEBAR
  // --------------------------------------------------------------------------
  function updateKPIsAndBadges() {
    // Lấy danh sách việc làm đã lưu hiện có
    const savedJobs = ALL_JOBS_DB.filter(j => bookmarkedIds.includes(j.id));

    // Thống kê
    const totalCount = savedJobs.length;
    const activeCount = totalCount; // Tất cả việc làm trong DB mẫu đều đang tuyển
    const expiringSoonCount = savedJobs.filter(j => j.deadlineDaysLeft <= 15).length;
    const appliedCount = savedJobs.filter(j => appliedJobIds.has(j.id)).length;

    // Cập nhật DOM KPI
    const statTotalEl = document.getElementById('statTotalSaved');
    const statActiveEl = document.getElementById('statActive');
    const statExpiringEl = document.getElementById('statExpiringSoon');
    const statAppliedEl = document.getElementById('statApplied');

    if (statTotalEl) statTotalEl.textContent = totalCount;
    if (statActiveEl) statActiveEl.textContent = activeCount;
    if (statExpiringEl) statExpiringEl.textContent = expiringSoonCount;
    if (statAppliedEl) statAppliedEl.textContent = appliedCount;

    // Cập nhật Badge trên Sidebar
    const sidebarSaveBadge = document.getElementById('sidebarSaveCount');
    const sidebarAppBadge = document.getElementById('sidebarAppCount');

    if (sidebarSaveBadge) sidebarSaveBadge.textContent = totalCount;
    if (sidebarAppBadge) sidebarAppBadge.textContent = appliedList.length;

    // Cập nhật Pill count trên thanh lọc
    const pillAllCount = document.getElementById('pillAllCount');
    const pillNotAppliedCount = document.getElementById('pillNotAppliedCount');
    const pillAppliedCount = document.getElementById('pillAppliedCount');
    const pillUrgentCount = document.getElementById('pillUrgentCount');

    if (pillAllCount) pillAllCount.textContent = totalCount;
    if (pillNotAppliedCount) pillNotAppliedCount.textContent = totalCount - appliedCount;
    if (pillAppliedCount) pillAppliedCount.textContent = appliedCount;
    if (pillUrgentCount) pillUrgentCount.textContent = expiringSoonCount;
  }

  // --------------------------------------------------------------------------
  // 6. LỌC VÀ SẮP XẾP DANH SÁCH VIỆC LÀM ĐÃ LƯU
  // --------------------------------------------------------------------------
  function getFilteredJobs() {
    // Lấy các job có ID nằm trong bookmarkedIds
    let list = ALL_JOBS_DB.filter(job => bookmarkedIds.includes(job.id));

    // Lọc theo từ khóa
    if (currentKeyword.trim() !== '') {
      const q = currentKeyword.toLowerCase().trim();
      list = list.filter(job => {
        return (
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          job.tags.some(tag => tag.toLowerCase().includes(q)) ||
          job.description.toLowerCase().includes(q)
        );
      });
    }

    // Lọc theo địa điểm
    if (currentLocation !== 'all') {
      list = list.filter(job => job.location === currentLocation);
    }

    // Lọc theo hình thức làm việc
    if (currentWorkType !== 'all') {
      list = list.filter(job => job.workType === currentWorkType);
    }

    // Lọc theo Quick Filter Tab
    if (currentQuickFilter === 'not-applied') {
      list = list.filter(job => !appliedJobIds.has(job.id));
    } else if (currentQuickFilter === 'applied') {
      list = list.filter(job => appliedJobIds.has(job.id));
    } else if (currentQuickFilter === 'urgent') {
      list = list.filter(job => job.deadlineDaysLeft <= 15);
    }

    // Sắp xếp
    if (currentSort === 'salary-desc') {
      list.sort((a, b) => b.salaryNum - a.salaryNum);
    } else if (currentSort === 'deadline-asc') {
      list.sort((a, b) => a.deadlineDaysLeft - b.deadlineDaysLeft);
    } else if (currentSort === 'default') {
      // Giữ thứ tự lưu gần đây (dựa theo index trong mảng bookmarkedIds)
      list.sort((a, b) => {
        return bookmarkedIds.indexOf(b.id) - bookmarkedIds.indexOf(a.id);
      });
    }

    return list;
  }

  // --------------------------------------------------------------------------
  // 7. RENDER DANH SÁCH THẺ VIỆC LÀM (JOB-LISTING-ITEM CHUẨN WIREFRAME)
  // --------------------------------------------------------------------------
  function renderSavedJobs() {
    updateKPIsAndBadges();

    const filtered = getFilteredJobs();

    if (savedCountEl) {
      savedCountEl.textContent = filtered.length;
    }

    // Nếu không có việc làm nào
    if (filtered.length === 0) {
      savedJobsListEl.style.display = 'none';
      emptyStateBox.style.display = 'flex';

      if (bookmarkedIds.length === 0) {
        // Chưa lưu việc nào
        emptyStateTitle.textContent = 'Bạn chưa lưu cơ hội việc làm nào!';
        emptyStateDesc.textContent = 'Khám phá hàng trăm tin tuyển dụng IT chất lượng trên JobPortal và bấm biểu tượng trái tim để lưu lại theo dõi.';
        if (emptyStateCta) {
          emptyStateCta.style.display = 'inline-flex';
          emptyStateCta.href = './jobs.html';
          emptyStateCta.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Khám phá việc làm ngay';
        }
      } else {
        // Có lưu nhưng bị lọc hết
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

    // Nếu có dữ liệu
    savedJobsListEl.style.display = 'flex';
    emptyStateBox.style.display = 'none';

    savedJobsListEl.innerHTML = filtered.map(job => {
      const isApplied = appliedJobIds.has(job.id);
      const isUrgentDeadline = job.deadlineDaysLeft <= 15;

      return `
        <article class="job-listing-item" data-id="${job.id}" style="position: relative;">
          <!-- Phần đầu thẻ: Logo, Tên công ty, Tiêu đề, Mức lương -->
          <div class="job-item-header">
            <div style="display: flex; gap: 16px; align-items: flex-start;">
              <!-- Logo Công ty -->
              <div class="company-logo-badge" style="background: ${job.logoBg}; width: 52px; height: 52px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: 1.1rem; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.12);">
                ${job.logo}
              </div>

              <!-- Tiêu đề & Công ty -->
              <div>
                <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">
                  <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-muted);">${job.company}</span>
                  ${job.verified ? `
                    <span class="candidate-badge" style="background: #ecfdf5; color: #047857; font-size: 0.725rem; padding: 2px 8px;">
                      <i class="fa-solid fa-circle-check"></i> Đã xác thực
                    </span>
                  ` : ''}
                  ${job.isHot ? `
                    <span class="candidate-badge" style="background: #fef2f2; color: #b91c1c; font-size: 0.725rem; padding: 2px 8px;">
                      <i class="fa-solid fa-fire"></i> Hot
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

            <!-- Mức lương & Nút bỏ lưu -->
            <div style="display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
              <span class="job-salary-pill" style="background: var(--color-primary-soft); color: var(--color-primary); padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 0.95rem; white-space: nowrap;">
                💰 ${job.salary}
              </span>

              <button 
                type="button" 
                class="btn-remove-saved" 
                data-id="${job.id}" 
                title="Bỏ lưu công việc này" 
                aria-label="Bỏ lưu ${job.title}"
                style="background: transparent; border: none; font-size: 1.35rem; cursor: pointer; color: var(--color-danger); transition: transform 0.2s; display: flex; align-items: center; justify-content: center; padding: 4px;"
                onmouseover="this.style.transform='scale(1.2)'"
                onmouseout="this.style.transform='scale(1)'"
              >
                ❤️
              </button>
            </div>
          </div>

          <!-- Đoạn mô tả vắn tắt -->
          <p style="font-size: 0.9rem; color: var(--color-body); line-height: 1.55; margin: 4px 0 8px;">
            ${job.description}
          </p>

          <!-- Danh sách Kỹ năng & Thẻ tags -->
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px;">
            ${job.tags.map(tag => `
              <span style="background: var(--color-bg-page); border: 1px solid var(--color-border); color: var(--color-dark); font-size: 0.775rem; padding: 3px 10px; border-radius: 6px; font-weight: 500;">
                #${tag}
              </span>
            `).join('')}
          </div>

          <!-- Thông tin bổ sung: Địa điểm, Hình thức, Kinh nghiệm -->
          <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 0.85rem; color: var(--color-muted); padding-top: 8px; border-top: 1px dashed var(--color-border-light);">
            <span><i class="fa-solid fa-location-dot" style="color: var(--color-primary); margin-right: 4px;"></i> ${job.locationLabel}</span>
            <span><i class="fa-regular fa-clock" style="color: var(--color-primary); margin-right: 4px;"></i> ${job.workTypeLabel}</span>
            <span><i class="fa-solid fa-briefcase" style="color: var(--color-primary); margin-right: 4px;"></i> ${job.experienceLabel}</span>
          </div>

          <!-- Chân thẻ: Hạn nộp, Trạng thái đã nộp và CTA Actions -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 8px; padding-top: 12px; border-top: 1px solid var(--color-border-light);">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <!-- Hạn chót nộp -->
              <span style="font-size: 0.825rem; font-weight: 600; color: ${isUrgentDeadline ? 'var(--color-danger)' : 'var(--color-muted)'}; display: flex; align-items: center; gap: 4px;">
                <i class="fa-regular fa-calendar-xmark"></i>
                Hạn nộp: ${job.deadlineText} ${isUrgentDeadline ? `(Còn ${job.deadlineDaysLeft} ngày)` : ''}
              </span>

              <!-- Huy hiệu trạng thái đã nộp -->
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

            <!-- Cụm nút hành động -->
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

    // Gắn sự kiện click bỏ lưu từng thẻ
    attachRemoveButtons();
  }

  // --------------------------------------------------------------------------
  // 8. XỬ LÝ SỰ KIỆN BỎ LƯU TỪNG TIN (REMOVE BOOKMARK)
  // --------------------------------------------------------------------------
  function attachRemoveButtons() {
    const removeBtns = document.querySelectorAll('.btn-remove-saved');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        const jobId = this.getAttribute('data-id');
        const targetJob = ALL_JOBS_DB.find(j => j.id === jobId);

        // Xóa khỏi danh sách bookmarkedIds
        bookmarkedIds = bookmarkedIds.filter(id => id !== jobId);
        setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);

        notify(`Đã bỏ lưu công việc "${targetJob ? targetJob.title : 'Việc làm'}"`, 'info');
        renderSavedJobs();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 9. XỬ LÝ XÓA TẤT CẢ VIỆC LÀM ĐÃ LƯU KÈM MODAL XÁC NHẬN
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
    btnConfirmClear.addEventListener('click', function () {
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

  // Lắng nghe sự kiện ô tìm kiếm với Debounce
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

  // Lắng nghe Dropdown Lọc
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

  // Lắng nghe Quick Filter Pills
  quickPills.forEach(pill => {
    pill.addEventListener('click', function () {
      quickPills.forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      currentQuickFilter = this.dataset.filter;
      renderSavedJobs();
    });
  });

  // --------------------------------------------------------------------------
  // 11. ĐĂNG XUẤT (LOGOUT)
  // --------------------------------------------------------------------------
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi JobPortal?')) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        notify('Đã đăng xuất thành công!', 'info');
        setTimeout(() => {
          window.location.href = './index.html';
        }, 500);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. KHỞI CHẠY LẦN ĐẦU
  // --------------------------------------------------------------------------
  renderSavedJobs();
});
