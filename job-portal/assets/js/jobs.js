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
  let filterOptions = { locations: [], categories: [], skills: [] };
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

  function renderCategoryRibbon() {
    const ribbon = document.getElementById('jobsCategoryRibbon');
    if (!ribbon) return;
    const iconMap = {
      'lap-trinh-phan-mem': 'fa-code',
      'khoa-hoc-du-lieu-ai': 'fa-chart-pie',
      'thiet-ke-ui-ux': 'fa-pen-ruler',
      'an-toan-thong-tin': 'fa-shield-halved',
      'cloud-devops': 'fa-cloud',
      'kiem-thu-phan-mem-qa': 'fa-vial-circle-check',
      'marketing-truyen-thong': 'fa-bullhorn',
      'tai-chinh-ke-toan': 'fa-coins',
      'kinh-doanh-ban-hang': 'fa-handshake',
      'nhan-su-hanh-chinh': 'fa-users-gear',
      'logistics-chuoi-cung-ung': 'fa-truck-fast',
      'thuong-mai-dien-tu': 'fa-cart-shopping',
      'xay-dung-kien-truc': 'fa-helmet-safety',
      'y-te-duoc-pham': 'fa-kit-medical',
      'giao-duc-dao-tao': 'fa-graduation-cap',
      'co-khi-san-xuat': 'fa-gears'
    };
    const activeCatId = filterCategory?.value || '';
    const cats = filterOptions.categories || [];
    const pills = [
      `<button type="button" class="cat-ribbon-pill ${activeCatId === '' ? 'active' : ''}" data-cat-id=""><i class="fa-solid fa-border-all" aria-hidden="true"></i><span>Tất cả ngành</span></button>`,
      ...cats.map((cat, idx) => {
        const icon = iconMap[cat.slug] || 'fa-briefcase';
        const isHidden = idx >= 6 && String(cat.category_id) !== String(activeCatId);
        return `<button type="button" class="cat-ribbon-pill${String(cat.category_id) === String(activeCatId) ? ' active' : ''}${isHidden ? ' is-hidden-pill' : ''}" data-cat-id="${Number(cat.category_id)}"><i class="fa-solid ${icon}" aria-hidden="true"></i><span>${escapeHtml(cat.category_name)}</span></button>`;
      })
    ];
    if (cats.length > 6) {
      const isExpanded = ribbon.classList.contains('is-expanded');
      pills.push(`<button type="button" class="cat-ribbon-pill cat-ribbon-more" id="btnToggleRibbonCats">${isExpanded ? 'Thu gọn' : `Xem thêm ${cats.length - 6} ngành`}</button>`);
    }
    ribbon.innerHTML = pills.join('');

    ribbon.querySelectorAll('.cat-ribbon-pill[data-cat-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (filterCategory) filterCategory.value = btn.dataset.catId || '';
        renderCategoryRibbon();
        loadJobs(true);
      });
    });
    const moreBtn = document.getElementById('btnToggleRibbonCats');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        const expanded = ribbon.classList.toggle('is-expanded');
        moreBtn.textContent = expanded ? 'Thu gọn' : `Xem thêm ${cats.length - 6} ngành`;
      });
    }
  }

  function syncSidebarQuickPills() {
    const badge = document.getElementById('activeFilterCountBadge');
    if (badge) {
      const filters = getFilters();
      const activeCount = [
        filters.location_id,
        filters.category_id,
        filters.skill_id,
        filters.employment_type,
        filters.experience_level,
        filters.salary_min,
        filters.salary_max
      ].filter(Boolean).length;
      badge.textContent = String(activeCount);
      badge.hidden = activeCount === 0;
    }

    const curEmp = filterEmployment?.value || '';
    document.querySelectorAll('.emp-preset-btn').forEach((btn) => {
      btn.classList.toggle('active', (btn.dataset.emp || '') === curEmp);
    });

    const curMin = filterSalaryMin?.value.trim() || '';
    const curMax = filterSalaryMax?.value.trim() || '';
    document.querySelectorAll('.salary-preset-btn').forEach((btn) => {
      const match = (btn.dataset.min || '') === curMin && (btn.dataset.max || '') === curMax;
      btn.classList.toggle('active', match);
    });

    renderCategoryRibbon();
  }

  function renderFilterOptions() {
    fillSelect(filterLocation, filterOptions.locations, 'location_id', 'location_name', 'Tất cả tỉnh/thành phố');
    fillSelect(filterCategory, filterOptions.categories, 'category_id', 'category_name', 'Tất cả ngành nghề');
    fillSelect(filterSkill, filterOptions.skills, 'skill_id', 'skill_name', 'Tất cả kỹ năng');
    fillSelect(topLocationSelect, filterOptions.locations, 'location_id', 'location_name', 'Tất cả địa điểm');
    renderCategoryRibbon();
  }

  async function loadFilterOptions() {
    try {
      if (!window.JobPortalAPI) throw new Error('API Client chưa được nạp.');
      const response = await window.JobPortalAPI.get('/jobs/filters');
      const data = response.data || {};
      filterOptions = {
        locations: Array.isArray(data.locations) ? data.locations : [],
        categories: Array.isArray(data.categories) ? data.categories : [],
        skills: Array.isArray(data.skills) ? data.skills : []
      };
    } catch (error) {
      console.error('[Module 1] Không tải được danh mục API:', error.message);
      filterOptions = { locations: [], categories: [], skills: [] };
      showNotice('Không kết nối được danh mục từ máy chủ API.', true);
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
    } catch (error) {
      if (sequence !== requestSequence) return;
      console.error('[Module 1] API jobs không khả dụng:', error.message);
      currentJobs = [];
      currentMeta = { page: currentPage, pageSize: PAGE_SIZE, total: 0, totalPages: 0 };
      showNotice('Không thể tải dữ liệu việc làm từ máy chủ API. Vui lòng thử lại sau.', true);
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
      const categoryName = escapeHtml(job.category_name || '');
      const skills = String(job.skills || '').split(',').map((skill) => skill.trim()).filter(Boolean);
      const visibleSkills = skills.slice(0, 4);
      const saved = bookmarkedIds.map(String).includes(String(id));
      const deadline = job.deadline ? new Date(`${String(job.deadline).slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN') : 'Chưa cập nhật';
      const description = escapeHtml(job.description || 'Thông tin mô tả đang được cập nhật.');
      const detailUrl = `./job-detail.html?id=${encodeURIComponent(id)}`;
      const logoMarkup = logoUrl
        ? `<img src="${logoUrl}" alt="${company}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='inline';"><span style="display:none;">${logoText}</span>`
        : `<span>${logoText}</span>`;
      return `
        <article class="job-listing-item" data-id="${escapeHtml(id)}">
          <div class="job-item-header">
            <div class="job-item-main">
              <div class="company-logo-box" aria-hidden="true">${logoMarkup}</div>
              <div style="min-width:0;">
                <h3 class="job-item-title"><a href="${detailUrl}">${title}</a></h3>
                <div class="job-item-company">
                  <strong>${company}</strong>
                  <i class="fa-solid fa-circle-check" style="color:var(--color-primary);font-size:0.8rem;" title="Doanh nghiệp đã xác thực" aria-hidden="true"></i>
                  ${categoryName ? `<span class="job-item-cat-pill">${categoryName}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="job-item-salary"><i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> ${escapeHtml(formatSalary(job))}</div>
          </div>
          <p class="job-item-desc">${description}</p>
          <div class="job-item-meta-row">
            <div class="job-item-meta-item"><i class="fa-solid fa-location-dot" aria-hidden="true"></i><span>${escapeHtml(job.location_name || 'Chưa cập nhật')}</span></div>
            <div class="job-item-meta-item"><i class="fa-solid fa-briefcase" aria-hidden="true"></i><span>${escapeHtml(labelExperience(job.experience_level))}</span></div>
            <div class="job-item-meta-item"><i class="fa-regular fa-clock" aria-hidden="true"></i><span>${escapeHtml(labelEmployment(job.employment_type))}</span></div>
          </div>
          ${visibleSkills.length ? `<div class="job-item-tags">${visibleSkills.map((skill) => `<span class="badge badge-tech">${escapeHtml(skill)}</span>`).join('')}${skills.length > 4 ? `<span class="badge badge-tech">+${skills.length - 4}</span>` : ''}</div>` : ''}
          <div class="job-item-footer">
            <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> Hạn nộp: <strong>${escapeHtml(deadline)}</strong></span>
            <div style="display:flex;align-items:center;gap:10px;">
              ${hideBookmarks ? '' : `<button type="button" class="btn-bookmark-job${saved ? ' is-saved' : ''}" data-id="${escapeHtml(id)}" title="${saved ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng này'}" aria-label="${saved ? 'Bỏ lưu tin tuyển dụng' : 'Lưu tin tuyển dụng'}">
                <i class="${saved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
              </button>`}
              <a href="${detailUrl}" class="job-item-action-link"><span>${hideBookmarks ? 'Xem chi tiết' : 'Xem chi tiết'}</span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
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

  // Events: thay đổi tiêu chí => đồng bộ quick pills & gọi API
  [filterLocation, filterCategory, filterSkill, filterEmployment, filterExperience, sortSelect].forEach((control) => {
    control?.addEventListener('change', () => {
      syncTopLocation();
      syncSidebarQuickPills();
      loadJobs(true);
    });
  });
  [filterSalaryMin, filterSalaryMax].forEach((control) =>
    control?.addEventListener('change', () => {
      syncSidebarQuickPills();
      loadJobs(true);
    })
  );

  document.querySelectorAll('.emp-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (filterEmployment) filterEmployment.value = btn.dataset.emp || '';
      syncSidebarQuickPills();
      loadJobs(true);
    });
  });

  document.querySelectorAll('.salary-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (filterSalaryMin) filterSalaryMin.value = btn.dataset.min || '';
      if (filterSalaryMax) filterSalaryMax.value = btn.dataset.max || '';
      syncSidebarQuickPills();
      loadJobs(true);
    });
  });

  topSearchInput?.addEventListener('input', debounce(() => loadJobs(true), 350));
  topSearchInput?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); loadJobs(true); } });
  topSearchBtn?.addEventListener('click', () => loadJobs(true));
  topLocationSelect?.addEventListener('change', () => {
    if (filterLocation) filterLocation.value = topLocationSelect.value;
    syncSidebarQuickPills();
    loadJobs(true);
  });
  btnApply?.addEventListener('click', () => { syncSidebarQuickPills(); loadJobs(true); closeDrawer(); });
  btnReset?.addEventListener('click', () => { resetFilters(); syncSidebarQuickPills(); });
  btnResetEmpty?.addEventListener('click', () => { resetFilters(); syncSidebarQuickPills(); });
  btnMobileFilter?.addEventListener('click', openDrawer);
  btnCloseSidebar?.addEventListener('click', closeDrawer);
  backdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer(); });

  (async function init() {
    const urlFilters = parseUrlParams();
    await loadFilterOptions();
    applyUrlFilterParams(urlFilters);
    syncSidebarQuickPills();
    await loadJobs(true);
    await syncSavedBookmarks();
  })();
});
