/**
 * ============================================================================
 * MODULE 1: TÌM KIẾM, LỌC ĐA TIÊU CHÍ & DANH SÁCH VIỆC LÀM
 * Thành viên: NGUYỄN LÊ GIA HÂN | MSSV: 052305001614
 * File: job-portal/assets/js/jobs.js
 * API: GET /api/v1/jobs/filters và GET /api/v1/jobs
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const PAGE_SIZE = 6;
  const FALLBACK_LOCATIONS = [
    { location_id: 1, location_name: 'TP. Hồ Chí Minh', slug: 'tp-ho-chi-minh' },
    { location_id: 2, location_name: 'Hà Nội', slug: 'ha-noi' },
    { location_id: 3, location_name: 'Đà Nẵng', slug: 'da-nang' },
    { location_id: 4, location_name: 'Cần Thơ', slug: 'can-tho' },
    { location_id: 7, location_name: 'Toàn quốc (Làm từ xa / Remote)', slug: 'remote' }
  ];
  const FALLBACK_CATEGORIES = [
    { category_id: 1, category_name: 'Lập Trình & Phát Triển Phần Mềm', slug: 'lap-trinh-phan-mem' },
    { category_id: 2, category_name: 'Khoa Học Dữ Liệu & AI/ML', slug: 'khoa-hoc-du-lieu-ai' },
    { category_id: 3, category_name: 'Thiết Kế UI/UX', slug: 'thiet-ke-ui-ux' },
    { category_id: 4, category_name: 'An Toàn Thông Tin', slug: 'an-toan-thong-tin' },
    { category_id: 5, category_name: 'Cloud & DevOps', slug: 'cloud-devops' },
    { category_id: 6, category_name: 'Kiểm Thử Phần Mềm QA/QC', slug: 'kiem-thu-phan-mem-qa' }
  ];
  const FALLBACK_SKILLS = [
    { skill_id: 1, skill_name: 'ReactJS', slug: 'reactjs' },
    { skill_id: 2, skill_name: 'Node.js', slug: 'nodejs' },
    { skill_id: 3, skill_name: 'TypeScript', slug: 'typescript' },
    { skill_id: 4, skill_name: 'Java', slug: 'java' },
    { skill_id: 5, skill_name: 'Spring Boot', slug: 'spring-boot' },
    { skill_id: 6, skill_name: 'Python', slug: 'python' },
    { skill_id: 7, skill_name: 'SQL', slug: 'sql' },
    { skill_id: 9, skill_name: 'Docker', slug: 'docker' },
    { skill_id: 10, skill_name: 'Kubernetes', slug: 'kubernetes' },
    { skill_id: 11, skill_name: 'AWS', slug: 'aws' },
    { skill_id: 12, skill_name: 'Figma', slug: 'figma' }
  ];

  // Dữ liệu mẫu chỉ dùng khi Backend/MySQL chưa chạy hoặc API không truy cập được.
  const FALLBACK_JOBS = [
    { job_id: 1, title: 'Frontend React Developer (Junior / Middle)', slug: 'frontend-react-developer-vng-01', description: 'Phát triển giao diện web với React, TypeScript và tối ưu trải nghiệm người dùng.', salary_min: 15000000, salary_max: 22000000, currency: 'VND', employment_type: 'full_time', experience_level: 'junior', deadline: '2026-11-25', created_at: '2026-11-14 08:00:00', company_name: 'Công Ty Cổ Phần Công Nghệ VNG', logo_url: '', company_id: 1, category_id: 1, category_name: 'Lập Trình & Phát Triển Phần Mềm', location_id: 1, location_name: 'TP. Hồ Chí Minh', skills: 'ReactJS, TypeScript, TailwindCSS' },
    { job_id: 2, title: 'Junior Backend Node.js / NestJS Engineer', slug: 'junior-backend-nodejs-fpt-02', description: 'Xây dựng RESTful API, Microservices và làm việc với cơ sở dữ liệu.', salary_min: 14000000, salary_max: 20000000, currency: 'VND', employment_type: 'full_time', experience_level: 'junior', deadline: '2026-11-30', created_at: '2026-11-13 08:00:00', company_name: 'FPT Software Global', logo_url: '', company_id: 2, category_id: 1, category_name: 'Lập Trình & Phát Triển Phần Mềm', location_id: 1, location_name: 'TP. Hồ Chí Minh', skills: 'Node.js, NestJS, Docker, Redis' },
    { job_id: 3, title: 'Thực Tập Sinh Lập Trình Java / Spring Boot', slug: 'thuc-tap-sinh-java-viettel-03', description: 'Chương trình thực tập dành cho sinh viên CNTT, có mentor hướng dẫn.', salary_min: 6000000, salary_max: 8000000, currency: 'VND', employment_type: 'internship', experience_level: 'fresher', deadline: '2026-12-15', created_at: '2026-11-12 08:00:00', company_name: 'Viettel Solutions', logo_url: '', company_id: 3, category_id: 1, category_name: 'Lập Trình & Phát Triển Phần Mềm', location_id: 2, location_name: 'Hà Nội', skills: 'Java, Spring Boot, SQL' },
    { job_id: 4, title: 'Chuyên Viên Phân Tích Dữ Liệu (Data Analyst)', slug: 'data-analyst-momo-04', description: 'Phân tích dữ liệu, xây dựng dashboard và báo cáo quản trị.', salary_min: 16000000, salary_max: 24000000, currency: 'VND', employment_type: 'full_time', experience_level: 'middle', deadline: '2026-11-20', created_at: '2026-11-11 08:00:00', company_name: 'MoMo', logo_url: '', company_id: 4, category_id: 2, category_name: 'Khoa Học Dữ Liệu & AI/ML', location_id: 1, location_name: 'TP. Hồ Chí Minh', skills: 'SQL, Python, Power BI' },
    { job_id: 5, title: 'UI/UX Product Designer', slug: 'ui-ux-product-designer-shopee-05', description: 'Thiết kế giao diện và trải nghiệm cho ứng dụng web, mobile.', salary_min: 18000000, salary_max: 28000000, currency: 'VND', employment_type: 'full_time', experience_level: 'middle', deadline: '2026-11-28', created_at: '2026-11-10 08:00:00', company_name: 'Shopee Vietnam', logo_url: '', company_id: 5, category_id: 3, category_name: 'Thiết Kế UI/UX', location_id: 1, location_name: 'TP. Hồ Chí Minh', skills: 'Figma, Design System' },
    { job_id: 6, title: 'DevOps & Cloud Engineer (AWS / Kubernetes)', slug: 'devops-cloud-engineer-kms-06', description: 'Vận hành hạ tầng Cloud, Docker, Kubernetes và CI/CD.', salary_min: 25000000, salary_max: 38000000, currency: 'VND', employment_type: 'full_time', experience_level: 'senior', deadline: '2026-12-05', created_at: '2026-11-09 08:00:00', company_name: 'KMS Technology Vietnam', logo_url: '', company_id: 6, category_id: 5, category_name: 'Cloud & DevOps', location_id: 3, location_name: 'Đà Nẵng', skills: 'AWS, Docker, Kubernetes' }
  ];

  const el = (id) => document.getElementById(id);
  const topSearchInput = el('topSearchInput');
  const topLocationSelect = el('topLocationSelect');
  const topSearchBtn = el('topSearchBtn');
  const filterLocation = el('filterLocation');
  const filterCategory = el('filterCategory');
  const filterSkill = el('filterSkill');
  const filterEmployment = el('filterEmployment');
  const filterExperience = el('filterExperience');
  const filterSalaryMin = el('filterSalaryMin');
  const filterSalaryMax = el('filterSalaryMax');
  const sortSelect = el('sortSelect');
  const jobsList = el('jobsListContainer');
  const resultsCount = el('resultsCount');
  const pagination = el('paginationWrap');
  const emptyState = el('emptyStateBox');
  const activeChips = el('activeChipsBar');
  const loading = el('jobsLoading');
  const errorNotice = el('jobsErrorNotice');
  const sidebar = el('jobsFilterSidebar');
  const backdrop = el('sidebarBackdrop');
  const btnMobileFilter = el('btnMobileFilter');
  const btnCloseSidebar = el('btnCloseSidebarMobile');
  const btnReset = el('btnResetAll');
  const btnResetEmpty = el('btnResetEmpty');
  const btnApply = el('btnApplyFilters');

  let currentPage = 1;
  let currentJobs = [];
  let currentMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 };
  let filterOptions = { locations: FALLBACK_LOCATIONS, categories: FALLBACK_CATEGORIES, skills: FALLBACK_SKILLS };
  let usingFallback = false;
  let requestSequence = 0;
  let bookmarkedIds = [];

  try { bookmarkedIds = JSON.parse(localStorage.getItem('jobportal_bookmarks') || '[]'); }
  catch (_) { bookmarkedIds = []; }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function formatSalary(job) {
    const min = job.salary_min === null || job.salary_min === undefined ? NaN : Number(job.salary_min);
    const max = job.salary_max === null || job.salary_max === undefined ? NaN : Number(job.salary_max);
    const currency = job.currency || 'VND';
    const format = (number) => new Intl.NumberFormat('vi-VN').format(number);
    if (!Number.isFinite(min) && !Number.isFinite(max)) return 'Thỏa thuận';
    if (Number.isFinite(min) && Number.isFinite(max)) return `${format(min)} - ${format(max)} ${currency}`;
    if (Number.isFinite(min)) return `Từ ${format(min)} ${currency}`;
    return `Đến ${format(max)} ${currency}`;
  }

  function labelEmployment(value) {
    return ({ full_time: 'Toàn thời gian', part_time: 'Bán thời gian', internship: 'Thực tập', remote: 'Từ xa (Remote)' })[value] || value || 'Chưa cập nhật';
  }

  function labelExperience(value) {
    return ({ intern: 'Thực tập', fresher: 'Fresher', junior: 'Junior', middle: 'Middle', senior: 'Senior', lead: 'Lead' })[value] || value || 'Chưa cập nhật';
  }

  function fillSelect(select, items, idKey, labelKey, placeholder) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>` + items.map((item) =>
      `<option value="${Number(item[idKey])}">${escapeHtml(item[labelKey])}</option>`
    ).join('');
    if (previous && items.some((item) => String(item[idKey]) === previous)) select.value = previous;
  }

  function renderFilterOptions() {
    fillSelect(filterLocation, filterOptions.locations, 'location_id', 'location_name', 'Tất cả tỉnh/thành phố');
    fillSelect(filterCategory, filterOptions.categories, 'category_id', 'category_name', 'Tất cả ngành nghề');
    fillSelect(filterSkill, filterOptions.skills, 'skill_id', 'skill_name', 'Tất cả kỹ năng');
    fillSelect(topLocationSelect, filterOptions.locations, 'location_id', 'location_name', 'Tất cả địa điểm');
  }

  async function loadFilterOptions() {
    try {
      if (!window.JobPortalAPI) throw new Error('API Client chưa được nạp.');
      const response = await window.JobPortalAPI.get('/jobs/filters');
      const data = response.data || {};
      filterOptions = {
        locations: Array.isArray(data.locations) ? data.locations : FALLBACK_LOCATIONS,
        categories: Array.isArray(data.categories) ? data.categories : FALLBACK_CATEGORIES,
        skills: Array.isArray(data.skills) ? data.skills : FALLBACK_SKILLS
      };
    } catch (error) {
      console.warn('[Module 1] Không tải được danh mục API, sử dụng danh mục mẫu:', error.message);
      filterOptions = { locations: FALLBACK_LOCATIONS, categories: FALLBACK_CATEGORIES, skills: FALLBACK_SKILLS };
      showNotice('Không kết nối được danh mục từ máy chủ. Trang đang dùng danh mục mẫu.', true);
    }
    renderFilterOptions();
  }

  function getFilters() {
    const locationId = filterLocation?.value || topLocationSelect?.value || '';
    const minValue = filterSalaryMin?.value.trim() || '';
    const maxValue = filterSalaryMax?.value.trim() || '';
    return {
      keyword: topSearchInput?.value.trim() || '',
      location_id: locationId,
      category_id: filterCategory?.value || '',
      skill_id: filterSkill?.value || '',
      employment_type: filterEmployment?.value || '',
      experience_level: filterExperience?.value || '',
      salary_min: minValue,
      salary_max: maxValue,
      sort: sortSelect?.value || 'newest'
    };
  }

  function buildQuery(filters, page) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) params.set(key, value);
    });
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    return params.toString();
  }

  function isStillOpen(job) {
    if (!job.deadline) return true;
    const deadline = new Date(`${String(job.deadline).slice(0, 10)}T23:59:59`);
    return Number.isNaN(deadline.getTime()) || deadline >= new Date();
  }

  function filterFallbackJobs(filters) {
    const keyword = filters.keyword.toLocaleLowerCase('vi');
    let result = FALLBACK_JOBS.filter((job) => {
      if (!isStillOpen(job)) return false;
      if (keyword) {
        const text = `${job.title} ${job.company_name} ${job.description} ${job.skills}`.toLocaleLowerCase('vi');
        if (!text.includes(keyword)) return false;
      }
      if (filters.location_id && Number(job.location_id) !== Number(filters.location_id)) return false;
      if (filters.category_id && Number(job.category_id) !== Number(filters.category_id)) return false;
      if (filters.skill_id && !String(job.skills || '').toLowerCase().includes(String(filterOptions.skills.find((s) => String(s.skill_id) === filters.skill_id)?.skill_name || '').toLowerCase())) return false;
      if (filters.employment_type && job.employment_type !== filters.employment_type) return false;
      if (filters.experience_level && job.experience_level !== filters.experience_level) return false;
      if (filters.salary_min && (job.salary_max == null || Number(job.salary_max) < Number(filters.salary_min))) return false;
      if (filters.salary_max && (job.salary_min == null || Number(job.salary_min) > Number(filters.salary_max))) return false;
      return true;
    });
    if (filters.sort === 'salary_desc') result.sort((a, b) => Number(b.salary_max || 0) - Number(a.salary_max || 0));
    else result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = result.length;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    return { jobs: result.slice(start, start + PAGE_SIZE), meta: { page: currentPage, pageSize: PAGE_SIZE, total, totalPages } };
  }

  function showNotice(message, isError) {
    if (!errorNotice) return;
    errorNotice.textContent = message;
    errorNotice.hidden = !message;
    errorNotice.classList.toggle('module1-status-error', Boolean(isError));
  }

  async function loadJobs(resetPage) {
    if (resetPage) currentPage = 1;
    const sequence = ++requestSequence;
    const filters = getFilters();
    if (loading) loading.hidden = false;
    if (jobsList) jobsList.setAttribute('aria-busy', 'true');
    if (errorNotice) errorNotice.hidden = true;

    try {
      if (!window.JobPortalAPI) throw new Error('Không tìm thấy JobPortalAPI.');
      const query = buildQuery(filters, currentPage);
      const response = await window.JobPortalAPI.get(`/jobs?${query}`);
      if (sequence !== requestSequence) return;
      currentJobs = Array.isArray(response.data) ? response.data : [];
      currentMeta = response.meta || { page: currentPage, pageSize: PAGE_SIZE, total: currentJobs.length, totalPages: 1 };
      usingFallback = false;
    } catch (error) {
      if (sequence !== requestSequence) return;
      console.warn('[Module 1] API jobs không khả dụng, chuyển sang dữ liệu mẫu:', error.message);
      const fallback = filterFallbackJobs(filters);
      currentJobs = fallback.jobs;
      currentMeta = fallback.meta;
      usingFallback = true;
      showNotice('Máy chủ/MySQL chưa sẵn sàng. Trang đang hiển thị dữ liệu mẫu để bạn vẫn xem và thử bộ lọc được.', true);
    } finally {
      if (sequence === requestSequence) {
        if (loading) loading.hidden = true;
        if (jobsList) jobsList.setAttribute('aria-busy', 'false');
      }
    }

    if (sequence !== requestSequence) return;
    renderJobs();
    renderPagination();
    renderActiveChips(filters);
  }

  function renderJobs() {
    if (resultsCount) resultsCount.textContent = Number(currentMeta.total || 0).toLocaleString('vi-VN');
    if (!jobsList) return;
    if (!currentJobs.length) {
      jobsList.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (pagination) pagination.innerHTML = '';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';
    const hideBookmarks = getLoggedInRole() === 'employer' || getLoggedInRole() === 'admin';

    jobsList.innerHTML = currentJobs.map((job) => {
      const id = job.job_id ?? job.id;
      const title = escapeHtml(job.title);
      const company = escapeHtml(job.company_name || job.company || 'Nhà tuyển dụng');
      const logoUrl = job.logo_url ? escapeHtml(job.logo_url) : '';
      const logoText = escapeHtml((job.company_name || 'J').trim().slice(0, 2).toUpperCase());
      const skills = String(job.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
      const saved = bookmarkedIds.map(String).includes(String(id));
      const deadline = job.deadline ? new Date(`${String(job.deadline).slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
      const description = escapeHtml(job.description || 'Thông tin mô tả đang được cập nhật.');
      const detailUrl = `./job-detail.html?id=${encodeURIComponent(id)}`;
      return `
        <article class="job-listing-item" data-id="${escapeHtml(id)}">
          <div class="job-item-header">
            <div class="job-item-main">
              <div class="company-logo-box" style="background:#fff;border:1px solid var(--color-border);" aria-hidden="true">
                ${logoUrl ? `<img src="${logoUrl}" alt="" style="width:100%;height:100%;object-fit:contain;">` : logoText}
              </div>
              <div>
                <h3 class="job-item-title"><a href="${detailUrl}">${title}</a></h3>
                <div class="job-item-company">
                  <i class="fa-regular fa-building" aria-hidden="true"></i>
                  <strong>${company}</strong>
                  <span class="job-code-badge"><i class="fa-solid fa-hashtag"></i> JOB-${escapeHtml(id)}</span>
                </div>
              </div>
            </div>
            <div class="job-item-salary"><i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> ${escapeHtml(formatSalary(job))}</div>
          </div>
          <p style="font-size:var(--text-small);color:var(--color-body);line-height:1.5;margin:4px 0 6px;">${description}</p>
          <div class="job-item-meta-row">
            <div class="job-item-meta-item"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>${escapeHtml(job.location_name || 'Chưa cập nhật')}</span></div>
            <div class="job-item-meta-item"><i class="fa-solid fa-briefcase" aria-hidden="true"></i><span>${escapeHtml(labelExperience(job.experience_level))}</span></div>
            <div class="job-item-meta-item"><i class="fa-regular fa-clock" aria-hidden="true"></i><span>${escapeHtml(labelEmployment(job.employment_type))}</span></div>
          </div>
          <div class="job-item-tags">${skills.map((skill) => `<span class="badge badge-tech">${escapeHtml(skill)}</span>`).join('')}</div>
          <div class="job-item-footer">
            <div><span style="color:var(--color-muted);"><i class="fa-regular fa-calendar" aria-hidden="true"></i> Hạn nộp: <strong>${escapeHtml(deadline)}</strong></span></div>
            <div style="display:flex;align-items:center;gap:12px;">
              ${hideBookmarks ? '' : `<button type="button" class="btn-bookmark-job" data-id="${escapeHtml(id)}" style="background:transparent;border:1px solid var(--color-border);width:34px;height:34px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:.95rem;cursor:pointer;color:${saved ? 'var(--color-primary)' : '#64748b'};" title="${saved ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng này'}" aria-label="${saved ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng'}">
                <i class="${saved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
              </button>`}
              <a href="${detailUrl}" class="job-item-action-link"><span>${hideBookmarks ? 'Xem chi tiết' : 'Xem chi tiết &amp; Nộp hồ sơ'}</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
            </div>
          </div>
        </article>`;
    }).join('');

    jobsList.querySelectorAll('.btn-bookmark-job').forEach((button) => {
      button.addEventListener('click', () => toggleBookmark(button.dataset.id));
    });
  }

  function renderPagination() {
    if (!pagination) return;
    const totalPages = Number(currentMeta.totalPages || 0);
    if (totalPages <= 1) { pagination.innerHTML = ''; return; }
    const page = Number(currentMeta.page || currentPage);
    let html = `<button type="button" class="page-btn page-prev" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>« Trước</button>`;
    for (let number = 1; number <= totalPages; number += 1) {
      html += `<button type="button" class="page-btn ${number === page ? 'active' : ''}" data-page="${number}" ${number === page ? 'aria-current="page"' : ''}>${number}</button>`;
    }
    html += `<button type="button" class="page-btn page-next" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Sau »</button>`;
    pagination.innerHTML = html;
    pagination.querySelectorAll('button[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        const nextPage = Number(button.dataset.page);
        if (!nextPage || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;
        currentPage = nextPage;
        loadJobs(false);
        document.getElementById('jobsMainLayout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  function renderActiveChips(filters) {
    if (!activeChips) return;
    const labels = [];
    if (filters.keyword) labels.push(['keyword', `Từ khóa: ${filters.keyword}`]);
    const location = filterOptions.locations.find((item) => String(item.location_id) === filters.location_id);
    const category = filterOptions.categories.find((item) => String(item.category_id) === filters.category_id);
    const skill = filterOptions.skills.find((item) => String(item.skill_id) === filters.skill_id);
    if (location) labels.push(['location', location.location_name]);
    if (category) labels.push(['category', category.category_name]);
    if (skill) labels.push(['skill', skill.skill_name]);
    if (filters.employment_type) labels.push(['employment', labelEmployment(filters.employment_type)]);
    if (filters.experience_level) labels.push(['experience', labelExperience(filters.experience_level)]);
    if (filters.salary_min) labels.push(['salary_min', `Từ ${Number(filters.salary_min).toLocaleString('vi-VN')} VND`]);
    if (filters.salary_max) labels.push(['salary_max', `Đến ${Number(filters.salary_max).toLocaleString('vi-VN')} VND`]);
    activeChips.style.display = labels.length ? 'flex' : 'none';
    activeChips.innerHTML = labels.map(([key, label]) => `<button type="button" class="active-chip" data-clear="${key}">${escapeHtml(label)} <i class="fa-solid fa-xmark"></i></button>`).join('');
    activeChips.querySelectorAll('[data-clear]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = ({ location: filterLocation, category: filterCategory, skill: filterSkill, employment: filterEmployment, experience: filterExperience, salary_min: filterSalaryMin, salary_max: filterSalaryMax })[button.dataset.clear];
        if (button.dataset.clear === 'keyword' && topSearchInput) topSearchInput.value = '';
        if (target) target.value = '';
        syncTopLocation();
        loadJobs(true);
      });
    });
  }

  function getLoggedInRole() {
    try {
      const api = window.JobPortalAPI;
      if (!api || typeof api.getToken !== 'function' || !api.getToken()) return 'guest';
      const raw = localStorage.getItem('jobportal_session');
      const session = raw ? JSON.parse(raw) : null;
      return (session && session.role) ? String(session.role).toLowerCase() : 'candidate';
    } catch (_) {
      return 'guest';
    }
  }

  function isCandidateLoggedIn() {
    return getLoggedInRole() === 'candidate';
  }

  async function syncSavedBookmarks() {
    if (!isCandidateLoggedIn()) return;
    try {
      const res = await window.JobPortalAPI.get('/candidate/saved-jobs');
      if (res && res.success && Array.isArray(res.data)) {
        bookmarkedIds = res.data.map((item) => item.job_id);
        try { localStorage.setItem('jobportal_bookmarks', JSON.stringify(bookmarkedIds)); } catch (_) {}
        renderJobs();
      }
    } catch (_) {}
  }

  async function toggleBookmark(id) {
    const normalized = String(id);
    const index = bookmarkedIds.map(String).indexOf(normalized);
    const willRemove = index >= 0;
    if (willRemove) bookmarkedIds.splice(index, 1);
    else bookmarkedIds.push(id);
    try { localStorage.setItem('jobportal_bookmarks', JSON.stringify(bookmarkedIds)); } catch (_) {}
    renderJobs();

    if (isCandidateLoggedIn()) {
      try {
        if (willRemove) {
          await window.JobPortalAPI.delete(`/candidate/saved-jobs/${id}`);
        } else {
          await window.JobPortalAPI.post(`/candidate/saved-jobs/${id}`, {});
        }
      } catch (err) {
        if (window.showToast) window.showToast(err.message || 'Không thể đồng bộ lưu việc làm lên máy chủ.', 'warning');
        return;
      }
    }

    if (window.showToast) window.showToast(willRemove ? 'Đã bỏ lưu việc làm.' : 'Đã lưu việc làm.', 'success');
  }

  function syncTopLocation() {
    if (topLocationSelect && filterLocation) topLocationSelect.value = filterLocation.value;
  }

  function resetFilters() {
    [topSearchInput, filterLocation, topLocationSelect, filterCategory, filterSkill, filterEmployment, filterExperience, filterSalaryMin, filterSalaryMax].forEach((control) => {
      if (control) control.value = '';
    });
    if (sortSelect) sortSelect.value = 'newest';
    loadJobs(true);
  }

  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (topSearchInput && params.has('keyword')) topSearchInput.value = params.get('keyword');
    const categoryParam = params.get('category_id') || params.get('category');
    const locationParam = params.get('location_id') || params.get('location');
    return { categoryParam, locationParam };
  }

  function applyUrlFilterParams(urlFilters) {
    if (urlFilters.categoryParam && filterCategory) {
      const found = filterOptions.categories.find((item) => String(item.category_id) === urlFilters.categoryParam || item.slug === urlFilters.categoryParam);
      if (found) filterCategory.value = String(found.category_id);
    }
    if (urlFilters.locationParam && filterLocation) {
      const aliases = { hcm: 'tp-ho-chi-minh', hanoi: 'ha-noi', danang: 'da-nang', cantho: 'can-tho', remote: 'remote' };
      const value = aliases[urlFilters.locationParam] || urlFilters.locationParam;
      const found = filterOptions.locations.find((item) => String(item.location_id) === value || item.slug === value);
      if (found) filterLocation.value = String(found.location_id);
      syncTopLocation();
    }
  }

  function openDrawer() {
    sidebar?.classList.add('is-open');
    backdrop?.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    sidebar?.classList.remove('is-open');
    backdrop?.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  function debounce(callback, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => callback(...args), delay); };
  }

  // Events: thay đổi tiêu chí => gọi API; đổi trang => gọi API với page mới.
  [filterLocation, filterCategory, filterSkill, filterEmployment, filterExperience, sortSelect].forEach((control) => {
    control?.addEventListener('change', () => { syncTopLocation(); loadJobs(true); });
  });
  [filterSalaryMin, filterSalaryMax].forEach((control) => control?.addEventListener('change', () => loadJobs(true)));
  topSearchInput?.addEventListener('input', debounce(() => loadJobs(true), 350));
  topSearchInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); loadJobs(true); } });
  topSearchBtn?.addEventListener('click', () => loadJobs(true));
  topLocationSelect?.addEventListener('change', () => {
    if (filterLocation) filterLocation.value = topLocationSelect.value;
    loadJobs(true);
  });
  btnApply?.addEventListener('click', () => { loadJobs(true); closeDrawer(); });
  btnReset?.addEventListener('click', resetFilters);
  btnResetEmpty?.addEventListener('click', resetFilters);
  btnMobileFilter?.addEventListener('click', openDrawer);
  btnCloseSidebar?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

  (async function init() {
    const urlFilters = parseUrlParams();
    await loadFilterOptions();
    applyUrlFilterParams(urlFilters);
    await loadJobs(true);
    await syncSavedBookmarks();
  })();
});
