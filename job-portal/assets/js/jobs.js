/**
 * ==========================================================================
 * MODULE 1: LOGIC TRA CỨU & BỘ LỌC ĐA TIÊU CHÍ (JOB SEARCH & FILTERING LOGIC)
 * --------------------------------------------------------------------------
 * Thành viên đảm nhiệm: NGUYỄN LÊ GIA HÂN
 * Mã số sinh viên (MSSV): 083306010188
 * Nhánh Git phát triển: le_han (Đã merge vào main)
 * Học phần: Lập trình Website — GVHD: ThS. Trần Thịnh Mạnh Đức — Nhóm 6 UTH
 * Thiết kế chuẩn: Wireframe Mục 5.2 & Quy tắc Responsive 5.7 (File QTTK.html)
 * 
 * PHẠM VI CHỨC NĂNG DO NGUYỄN LÊ GIA HÂN HIỆN THỰC HÓA:
 *   - Mục 1: Bộ dữ liệu mẫu 12 việc làm IT chuẩn hóa (JOBS_DATA)
 *   - Mục 2: Biến quản lý trạng thái phân trang (currentPage, itemsPerPage)
 *   - Mục 3: Phân tích tham số URL (parseUrlParams: ?keyword=...&location=...&category=...)
 *   - Mục 4: Trích xuất tiêu chí lọc đang được chọn (getSelectedFilters)
 *   - Mục 5: Bộ máy lọc dữ liệu thời gian thực (Filter Engine đa điều kiện)
 *   - Mục 6: Thuật toán sắp xếp danh sách (Mới nhất, Lương giảm dần, Hạn nộp)
 *   - Mục 7: Render động thẻ danh sách việc làm chuẩn viền xanh 4.5px F-pattern
 *   - Mục 8: Render và điều khiển linh kiện phân trang (Pagination Controller)
 *   - Mục 9: Quản lý và render các chip lọc đang kích hoạt (Active Filter Chips)
 *   - Mục 10: Tự động đếm số lượng việc làm theo từng tiêu chí thời gian thực
 *   - Mục 11: Lưu / Bỏ lưu việc làm yêu thích vào localStorage (Bookmark Toggle)
 *   - Mục 12: Xử lý sự kiện bàn phím, Debounce tìm kiếm và Drawer trên Mobile
 *   - Mục 13: Hàm khởi tạo trang và kích hoạt lọc ban đầu (Initialization)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. CƠ SỞ DỮ LIỆU VIỆC LÀM MẪU (CHUYÊN BIỆT IT & TECH CHO SINH VIÊN / KỸ SƯ)
  // --------------------------------------------------------------------------
  const JOBS_DATA = [
    {
      id: 'job-01',
      title: 'Frontend React Developer (Junior / Middle)',
      company: 'Công Ty Cổ Phần Công Nghệ VNG',
      logo: 'VNG',
      logoBg: 'linear-gradient(135deg, #ff6b4a 0%, #ff8e53 100%)',
      verified: true,
      salary: '15 - 22 Triệu',
      salaryNum: 22,
      salaryRange: '15-25',
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
      deadlineDaysLeft: 25,
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
      salaryRange: '10-15',
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
      deadlineDaysLeft: 30,
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
      salaryRange: 'under-10',
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
      deadlineDaysLeft: 45,
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
      salaryRange: '15-25',
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
      deadlineDaysLeft: 20,
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
      salaryRange: '15-25',
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
      deadlineDaysLeft: 28,
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
      salaryRange: 'over-25',
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
      deadlineDaysLeft: 35,
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
      salaryRange: '15-25',
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
      deadlineDaysLeft: 18,
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
      salaryRange: '15-25',
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
      deadlineDaysLeft: 40,
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
      salaryRange: '15-25',
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
      deadlineDaysLeft: 42,
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
      salaryRange: 'under-10',
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
      deadlineDaysLeft: 22,
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
      salaryRange: '15-25',
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
      deadlineDaysLeft: 31,
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
      salaryRange: '10-15',
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
      deadlineDaysLeft: 50,
      isHot: false,
      isUrgent: false,
      description: 'Phát triển Driver và Firmware nhúng trên vi điều khiển bán dẫn cho xe ô tô tự hành và thiết bị IoT. Cơ hội đào tạo tại Nhật Bản.'
    }
  ];

  // --------------------------------------------------------------------------
  // 2. BIẾN TRẠNG THÁI (STATE VARIABLES)
  // --------------------------------------------------------------------------
  const ITEMS_PER_PAGE = 5;
  let currentPage = 1;
  let currentFilteredJobs = [...JOBS_DATA];

  // DOM Elements
  const jobsListContainer = document.getElementById('jobsListContainer');
  const resultsCountEl = document.getElementById('resultsCount');
  const emptyStateBox = document.getElementById('emptyStateBox');
  const paginationWrap = document.getElementById('paginationWrap');
  const activeChipsBar = document.getElementById('activeChipsBar');
  const btnResetAll = document.getElementById('btnResetAll');
  const sortSelect = document.getElementById('sortSelect');

  // Search input & top strip elements
  const topSearchInput = document.getElementById('topSearchInput');
  const topLocationSelect = document.getElementById('topLocationSelect');
  const topSearchBtn = document.getElementById('topSearchBtn');

  // Mobile Drawer elements
  const btnMobileFilter = document.getElementById('btnMobileFilter');
  const jobsFilterSidebar = document.getElementById('jobsFilterSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  const btnCloseSidebarMobile = document.getElementById('btnCloseSidebarMobile');

  // Local storage bookmarks
  let bookmarkedJobIds = JSON.parse(localStorage.getItem('jobportal_bookmarks') || '[]');

  // --------------------------------------------------------------------------
  // 3. ĐỌC THAM SỐ URL (READ URL QUERY PARAMS)
  // Cho phép chuyển từ trang chủ: jobs.html?keyword=React&location=hcm&category=software
  // --------------------------------------------------------------------------
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const keyword = params.get('keyword');
    const location = params.get('location');
    const category = params.get('category');

    if (keyword && topSearchInput) {
      topSearchInput.value = keyword;
    }

    if (location && topLocationSelect) {
      topLocationSelect.value = location;
      // Đồng thời tick checkbox sidebar
      const locCheckbox = document.querySelector(`input[name="filterLocation"][value="${location}"]`);
      if (locCheckbox) locCheckbox.checked = true;
    }

    if (category) {
      // Ánh xạ các alias từ trang chủ (it -> software, uiux -> design, data -> data-ai)
      let mappedCat = category;
      if (category === 'it') mappedCat = 'software';
      if (category === 'uiux') mappedCat = 'design';
      if (category === 'data') mappedCat = 'data-ai';

      const catCheckbox = document.querySelector(`input[name="filterCategory"][value="${mappedCat}"]`);
      if (catCheckbox) catCheckbox.checked = true;
    }
  }

  // --------------------------------------------------------------------------
  // 4. LẤY CÁC GIÁ TRỊ BỘ LỌC ĐANG CHỌN (GET CURRENT FILTER VALUES)
  // --------------------------------------------------------------------------
  function getSelectedFilters() {
    const keyword = (topSearchInput ? topSearchInput.value.trim().toLowerCase() : '');
    const topLoc = (topLocationSelect ? topLocationSelect.value : '');

    // Lấy checkbox
    const locations = Array.from(document.querySelectorAll('input[name="filterLocation"]:checked')).map(cb => cb.value);
    // Nếu dropdown top bar chọn địa điểm và checkbox chưa tick, kết hợp
    if (topLoc && !locations.includes(topLoc)) {
      locations.push(topLoc);
    }

    const salaries = Array.from(document.querySelectorAll('input[name="filterSalary"]:checked')).map(cb => cb.value);
    const workTypes = Array.from(document.querySelectorAll('input[name="filterWorkType"]:checked')).map(cb => cb.value);
    const experiences = Array.from(document.querySelectorAll('input[name="filterExperience"]:checked')).map(cb => cb.value);
    const categories = Array.from(document.querySelectorAll('input[name="filterCategory"]:checked')).map(cb => cb.value);

    return {
      keyword,
      locations,
      salaries,
      workTypes,
      experiences,
      categories
    };
  }

  // --------------------------------------------------------------------------
  // 5. THỰC HIỆN LỌC DỮ LIỆU (FILTER ENGINE)
  // --------------------------------------------------------------------------
  function applyFilters() {
    const filters = getSelectedFilters();

    currentFilteredJobs = JOBS_DATA.filter(job => {
      // 1. Lọc theo từ khóa (Tìm trong Title, Company, Tags, Description)
      if (filters.keyword) {
        const fullSearchableText = `${job.title} ${job.company} ${job.tags.join(' ')} ${job.description} ${job.locationLabel}`.toLowerCase();
        if (!fullSearchableText.includes(filters.keyword)) {
          return false;
        }
      }

      // 2. Lọc theo địa điểm (Location)
      if (filters.locations.length > 0) {
        if (!filters.locations.includes(job.location)) {
          return false;
        }
      }

      // 3. Lọc theo mức lương (Salary Range)
      if (filters.salaries.length > 0) {
        if (!filters.salaries.includes(job.salaryRange)) {
          return false;
        }
      }

      // 4. Lọc theo hình thức làm việc (Work Type)
      if (filters.workTypes.length > 0) {
        if (!filters.workTypes.includes(job.workType)) {
          return false;
        }
      }

      // 5. Lọc theo kinh nghiệm (Experience)
      if (filters.experiences.length > 0) {
        if (!filters.experiences.includes(job.experience)) {
          return false;
        }
      }

      // 6. Lọc theo ngành nghề (Category)
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(job.category)) {
          return false;
        }
      }

      return true;
    });

    // Sắp xếp dữ liệu (Sort)
    sortFilteredJobs();

    // Reset về trang 1
    currentPage = 1;

    // Cập nhật giao diện
    renderResults();
    renderActiveChips(filters);
    updateFilterCounts();
  }

  // --------------------------------------------------------------------------
  // 6. SẮP XẾP DỮ LIỆU (SORTING)
  // --------------------------------------------------------------------------
  function sortFilteredJobs() {
    const sortVal = sortSelect ? sortSelect.value : 'newest';

    currentFilteredJobs.sort((a, b) => {
      if (sortVal === 'salary-desc') {
        return b.salaryNum - a.salaryNum;
      } else if (sortVal === 'deadline-asc') {
        return a.deadlineDaysLeft - b.deadlineDaysLeft;
      } else {
        // 'newest' mặc định
        return a.postedDaysAgo - b.postedDaysAgo;
      }
    });
  }

  // --------------------------------------------------------------------------
  // 7. HIỂN THỊ DANH SÁCH VIỆC LÀM & PHÂN TRANG (RENDER RESULTS & PAGINATION)
  // --------------------------------------------------------------------------
  function renderResults() {
    if (!jobsListContainer) return;

    const totalCount = currentFilteredJobs.length;

    // Cập nhật thanh kết quả
    if (resultsCountEl) {
      resultsCountEl.textContent = totalCount;
    }

    // Nếu không có kết quả
    if (totalCount === 0) {
      jobsListContainer.innerHTML = '';
      if (emptyStateBox) emptyStateBox.style.display = 'block';
      if (paginationWrap) paginationWrap.style.display = 'none';
      return;
    }

    if (emptyStateBox) emptyStateBox.style.display = 'none';
    if (paginationWrap) paginationWrap.style.display = 'flex';

    // Cắt mảng theo phân trang
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedItems = currentFilteredJobs.slice(startIndex, endIndex);

    // Sinh HTML các thẻ việc làm (Chuẩn Wireframe 5.2)
    jobsListContainer.innerHTML = paginatedItems.map(job => {
      const isBookmarked = bookmarkedJobIds.includes(job.id);
      return `
        <article class="job-listing-item" data-id="${job.id}">
          <!-- Phần đầu thẻ: Logo, Tiêu đề, Mức lương -->
          <div class="job-item-header">
            <div class="job-item-main">
              <!-- Logo công ty -->
              <div class="company-logo-box" style="background: ${job.logoBg}; color: #ffffff;" aria-hidden="true">
                ${job.logo}
              </div>

              <!-- Tiêu đề & Tên doanh nghiệp -->
              <div>
                <h3 class="job-item-title">
                  <a href="./job-detail.html?id=${job.id}">${job.title}</a>
                </h3>
                <div class="job-item-company">
                  <span>🏢</span>
                  <strong>${job.company}</strong>
                  ${job.verified ? '<span class="badge badge-verified" title="Doanh nghiệp đã kiểm duyệt xác thực">✓ Xác thực</span>' : ''}
                  ${job.isHot ? '<span class="badge badge-urgent">🔥 Tuyển Gấp</span>' : ''}
                </div>
              </div>
            </div>

            <!-- Khối mức lương nổi bật (Màu Emerald - Chuẩn WCAG) -->
            <div class="job-item-salary" aria-label="Mức lương ${job.salary}">
              💰 ${job.salary}
            </div>
          </div>

          <!-- Thông tin tóm tắt & Địa điểm -->
          <p style="font-size: var(--text-small); color: var(--color-body); line-height: 1.5; margin: 4px 0 6px;">
            ${job.description}
          </p>

          <!-- Hàng Metadata thông số (Địa điểm, Kinh nghiệm, Hình thức) -->
          <div class="job-item-meta-row">
            <div class="job-item-meta-item">
              <span aria-hidden="true">📍</span>
              <span>${job.locationLabel}</span>
            </div>
            <div class="job-item-meta-item">
              <span aria-hidden="true">💼</span>
              <span>${job.experienceLabel}</span>
            </div>
            <div class="job-item-meta-item">
              <span aria-hidden="true">🕒</span>
              <span>${job.workTypeLabel}</span>
            </div>
          </div>

          <!-- Nhãn công nghệ & Kỹ năng (Tech Tags) -->
          <div class="job-item-tags">
            ${job.tags.map(tag => `<span class="badge badge-tech">${tag}</span>`).join('')}
          </div>

          <!-- Phần đáy thẻ: Thời gian đăng, Hạn nộp & Nút hành động -->
          <div class="job-item-footer">
            <div>
              <span style="color: var(--color-muted);">🕒 Đăng ${job.postedText} • Hạn nộp: <strong>${job.deadlineText}</strong></span>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <!-- Nút lưu tin tuyển dụng (Bookmark) -->
              <button 
                type="button" 
                class="btn-bookmark-job" 
                data-id="${job.id}" 
                style="background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: ${isBookmarked ? 'var(--color-danger)' : '#94a3b8'}; transition: transform 0.2s;"
                title="${isBookmarked ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng này'}"
                aria-label="${isBookmarked ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng'}"
              >
                ${isBookmarked ? '❤️' : '🤍'}
              </button>

              <!-- CTA Xem chi tiết & Ứng tuyển -->
              <a href="./job-detail.html?id=${job.id}" class="job-item-action-link">
                <span>Xem chi tiết &amp; Nộp hồ sơ</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Gắn sự kiện click Bookmark
    attachBookmarkHandlers();

    // Render nút phân trang
    renderPagination(totalCount);
  }

  // --------------------------------------------------------------------------
  // 8. RENDER PHÂN TRANG (RENDER PAGINATION)
  // --------------------------------------------------------------------------
  function renderPagination(totalCount) {
    if (!paginationWrap) return;

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
      paginationWrap.innerHTML = '';
      return;
    }

    let html = '';

    // Nút Trước (« Trước)
    html += `
      <button 
        type="button" 
        class="page-btn page-prev" 
        ${currentPage === 1 ? 'disabled' : ''} 
        aria-label="Trang trước"
      >
        « Trước
      </button>
    `;

    // Các trang số (1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button 
          type="button" 
          class="page-btn ${i === currentPage ? 'active' : ''}" 
          data-page="${i}"
          aria-label="Trang ${i}"
          aria-current="${i === currentPage ? 'page' : 'false'}"
        >
          ${i}
        </button>
      `;
    }

    // Nút Sau (Sau »)
    html += `
      <button 
        type="button" 
        class="page-btn page-next" 
        ${currentPage === totalPages ? 'disabled' : ''} 
        aria-label="Trang sau"
      >
        Sau »
      </button>
    `;

    paginationWrap.innerHTML = html;

    // Gắn sự kiện cho các nút phân trang
    const prevBtn = paginationWrap.querySelector('.page-prev');
    const nextBtn = paginationWrap.querySelector('.page-next');
    const pageBtns = paginationWrap.querySelectorAll('.page-btn[data-page]');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderResults();
          scrollToResultsTop();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderResults();
          scrollToResultsTop();
        }
      });
    }

    pageBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page, 10);
        if (page && page !== currentPage) {
          currentPage = page;
          renderResults();
          scrollToResultsTop();
        }
      });
    });
  }

  function scrollToResultsTop() {
    const mainSection = document.getElementById('jobsMainLayout');
    if (mainSection) {
      mainSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // --------------------------------------------------------------------------
  // 9. THANH BỘ LỌC ĐANG CHỌN (ACTIVE FILTER CHIPS)
  // --------------------------------------------------------------------------
  const FILTER_LABELS = {
    // Locations
    hcm: 'TP. Hồ Chí Minh',
    hanoi: 'Hà Nội',
    danang: 'Đà Nẵng',
    cantho: 'Cần Thơ',
    remote: 'Remote / Toàn quốc',
    // Salaries
    'under-10': 'Dưới 10 Triệu',
    '10-15': '10 - 15 Triệu',
    '15-25': '15 - 25 Triệu',
    'over-25': 'Trên 25 Triệu',
    // Work types
    fulltime: 'Toàn thời gian (Full-time)',
    parttime: 'Bán thời gian (Part-time)',
    internship: 'Thực tập sinh (Internship)',
    // Experiences
    fresher: 'Fresher / Dưới 1 năm',
    '1-3': '1 - 3 năm kinh nghiệm',
    '3-5': '3 - 5 năm kinh nghiệm',
    'over-5': 'Trên 5 năm kinh nghiệm',
    // Categories
    software: 'Lập trình / Phần mềm',
    'data-ai': 'Dữ liệu & AI / ML',
    design: 'Thiết kế UI/UX',
    security: 'An toàn thông tin',
    'cloud-devops': 'Cloud & DevOps'
  };

  function renderActiveChips(filters) {
    if (!activeChipsBar) return;

    const chips = [];

    // Chip từ khóa
    if (filters.keyword) {
      chips.push({
        type: 'keyword',
        value: filters.keyword,
        text: `Từ khóa: "${filters.keyword}"`
      });
    }

    // Chip địa điểm
    filters.locations.forEach(val => {
      chips.push({
        type: 'location',
        value: val,
        text: FILTER_LABELS[val] || val
      });
    });

    // Chip mức lương
    filters.salaries.forEach(val => {
      chips.push({
        type: 'salary',
        value: val,
        text: FILTER_LABELS[val] || val
      });
    });

    // Chip hình thức
    filters.workTypes.forEach(val => {
      chips.push({
        type: 'workType',
        value: val,
        text: FILTER_LABELS[val] || val
      });
    });

    // Chip kinh nghiệm
    filters.experiences.forEach(val => {
      chips.push({
        type: 'experience',
        value: val,
        text: FILTER_LABELS[val] || val
      });
    });

    // Chip ngành nghề
    filters.categories.forEach(val => {
      chips.push({
        type: 'category',
        value: val,
        text: FILTER_LABELS[val] || val
      });
    });

    // Render ra DOM
    if (chips.length === 0) {
      activeChipsBar.innerHTML = '';
      activeChipsBar.style.display = 'none';
      return;
    }

    activeChipsBar.style.display = 'flex';
    activeChipsBar.innerHTML = `
      <span style="font-size: var(--text-xs); color: var(--color-muted); font-weight: 600;">Đang lọc theo:</span>
      ${chips.map(chip => `
        <span class="active-chip" data-type="${chip.type}" data-val="${chip.value}">
          <span>${chip.text}</span>
          <button type="button" class="chip-remove-btn" aria-label="Xóa bộ lọc ${chip.text}">✕</button>
        </span>
      `).join('')}
    `;

    // Gắn sự kiện xóa từng chip
    const removeBtns = activeChipsBar.querySelectorAll('.chip-remove-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        const parentChip = this.closest('.active-chip');
        const type = parentChip.dataset.type;
        const val = parentChip.dataset.val;

        if (type === 'keyword') {
          if (topSearchInput) topSearchInput.value = '';
        } else if (type === 'location') {
          const cb = document.querySelector(`input[name="filterLocation"][value="${val}"]`);
          if (cb) cb.checked = false;
          if (topLocationSelect && topLocationSelect.value === val) topLocationSelect.value = '';
        } else if (type === 'salary') {
          const cb = document.querySelector(`input[name="filterSalary"][value="${val}"]`);
          if (cb) cb.checked = false;
        } else if (type === 'workType') {
          const cb = document.querySelector(`input[name="filterWorkType"][value="${val}"]`);
          if (cb) cb.checked = false;
        } else if (type === 'experience') {
          const cb = document.querySelector(`input[name="filterExperience"][value="${val}"]`);
          if (cb) cb.checked = false;
        } else if (type === 'category') {
          const cb = document.querySelector(`input[name="filterCategory"][value="${val}"]`);
          if (cb) cb.checked = false;
        }

        applyFilters();
      });
    });
  }

  // --------------------------------------------------------------------------
  // 10. ĐẾM SỐ LƯỢNG VIỆC LÀM CHO TỪNG TIÊU CHÍ (UPDATE FILTER COUNTS)
  // --------------------------------------------------------------------------
  function updateFilterCounts() {
    // Duyệt qua tất cả các checkbox và tính số lượng khớp trong JOBS_DATA
    const checkboxes = document.querySelectorAll('.filter-checkbox');
    checkboxes.forEach(cb => {
      const name = cb.name;
      const val = cb.value;
      const countEl = cb.closest('.filter-label')?.querySelector('.filter-count');
      if (!countEl) return;

      let count = 0;
      if (name === 'filterLocation') {
        count = JOBS_DATA.filter(j => j.location === val).length;
      } else if (name === 'filterSalary') {
        count = JOBS_DATA.filter(j => j.salaryRange === val).length;
      } else if (name === 'filterWorkType') {
        count = JOBS_DATA.filter(j => j.workType === val).length;
      } else if (name === 'filterExperience') {
        count = JOBS_DATA.filter(j => j.experience === val).length;
      } else if (name === 'filterCategory') {
        count = JOBS_DATA.filter(j => j.category === val).length;
      }

      countEl.textContent = `(${count})`;
    });
  }

  // --------------------------------------------------------------------------
  // 11. XỬ LÝ LƯU TIN (BOOKMARKING JOBS)
  // --------------------------------------------------------------------------
  function attachBookmarkHandlers() {
    const bookmarkBtns = document.querySelectorAll('.btn-bookmark-job');
    bookmarkBtns.forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const jobId = this.dataset.id;
        const job = JOBS_DATA.find(j => j.id === jobId);
        const index = bookmarkedJobIds.indexOf(jobId);

        if (index > -1) {
          bookmarkedJobIds.splice(index, 1);
          this.innerHTML = '🤍';
          this.style.color = '#94a3b8';
          this.title = 'Lưu tin tuyển dụng này';
          if (window.showToast) {
            window.showToast(`Đã bỏ lưu tin "${job?.title || 'Việc làm'}"`, 'info');
          }
        } else {
          bookmarkedJobIds.push(jobId);
          this.innerHTML = '❤️';
          this.style.color = 'var(--color-danger)';
          this.title = 'Bỏ lưu tin tuyển dụng';
          if (window.showToast) {
            window.showToast(`Đã lưu tin "${job?.title || 'Việc làm'}" vào danh sách yêu thích!`, 'success');
          }
        }

        localStorage.setItem('jobportal_bookmarks', JSON.stringify(bookmarkedJobIds));
      });
    });
  }

  // --------------------------------------------------------------------------
  // 12. SỰ KIỆN GẮN KẾT TOÀN DIỆN (EVENT LISTENERS)
  // --------------------------------------------------------------------------

  // Checkbox thay đổi -> Lọc tức thời (Instant Filter)
  const allCheckboxes = document.querySelectorAll('.filter-checkbox');
  allCheckboxes.forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });

  // Top Search input & Location Select
  if (topSearchInput) {
    topSearchInput.addEventListener('input', debounce(applyFilters, 300));
    topSearchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFilters();
      }
    });
  }

  if (topLocationSelect) {
    topLocationSelect.addEventListener('change', function () {
      const selectedLoc = this.value;
      // Đồng bộ checkbox
      document.querySelectorAll('input[name="filterLocation"]').forEach(cb => {
        cb.checked = (selectedLoc && cb.value === selectedLoc);
      });
      applyFilters();
    });
  }

  if (topSearchBtn) {
    topSearchBtn.addEventListener('click', applyFilters);
  }

  // Sort dropdown
  if (sortSelect) {
    sortSelect.addEventListener('change', function () {
      sortFilteredJobs();
      currentPage = 1;
      renderResults();
    });
  }

  // Nút xóa tất cả bộ lọc (Reset)
  function resetAllFilters() {
    if (topSearchInput) topSearchInput.value = '';
    if (topLocationSelect) topLocationSelect.value = '';
    allCheckboxes.forEach(cb => { cb.checked = false; });
    if (sortSelect) sortSelect.value = 'newest';
    applyFilters();
    if (window.showToast) {
      window.showToast('Đã đặt lại tất cả bộ lọc về mặc định.', 'info');
    }
  }

  if (btnResetAll) {
    btnResetAll.addEventListener('click', resetAllFilters);
  }

  const btnResetEmpty = document.getElementById('btnResetEmpty');
  if (btnResetEmpty) {
    btnResetEmpty.addEventListener('click', resetAllFilters);
  }

  // Nút Drawer trên Mobile
  function openMobileSidebar() {
    if (jobsFilterSidebar) jobsFilterSidebar.classList.add('is-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    if (jobsFilterSidebar) jobsFilterSidebar.classList.remove('is-open');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  if (btnMobileFilter) {
    btnMobileFilter.addEventListener('click', openMobileSidebar);
  }

  if (btnCloseSidebarMobile) {
    btnCloseSidebarMobile.addEventListener('click', closeMobileSidebar);
  }

  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  // Tiện ích Debounce
  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // --------------------------------------------------------------------------
  // 13. KHỞI TẠO TRANG LẦN ĐẦU (INITIALIZATION)
  // --------------------------------------------------------------------------
  parseUrlParams();
  applyFilters();
});
