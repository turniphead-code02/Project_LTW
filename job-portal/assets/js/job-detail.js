/**
 * ==========================================================================
 * MODULE 2: CHI TIẾT VIỆC LÀM & MODAL ỨNG TUYỂN (API REAL — ZERO MOCK DB)
 * Thành viên đảm nhiệm: HỒ TRÚC GIA HÂN (MSSV: 056306004131)
 * API: GET /api/v1/job-detail/:id | POST /api/v1/job-detail/:id/apply
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', async function () {
  'use strict';

  const API = window.JobPortalAPI;
  const params = new URLSearchParams(window.location.search);
  const currentJobId = params.get('id');

  let job = null;
  let bookmarks = [];
  let appliedJobIds = new Set();
  let currentUploadedFile = null;

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function hasAuth() {
    return Boolean(API && typeof API.getToken === 'function' && API.getToken());
  }

  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('jobportal_session') || 'null');
    } catch (_) {
      return null;
    }
  }

  function getSessionRole() {
    if (!hasAuth()) return 'guest';
    const sess = getSession();
    return (sess && sess.role) ? String(sess.role).toLowerCase() : 'candidate';
  }

  function formatSalary(minRaw, maxRaw, currency = 'VND') {
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (currency === 'USD' && (min > 0 || max > 0)) {
      if (min > 0 && max > 0) return `$${min.toLocaleString('en-US')} - $${max.toLocaleString('en-US')}`;
      return min > 0 ? `Từ $${min.toLocaleString('en-US')}` : `Đến $${max.toLocaleString('en-US')}`;
    }
    const toTrieu = v => {
      const val = v >= 100000 ? v / 1e6 : v;
      return Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, '');
    };
    if (min > 0 && max > 0) return `${toTrieu(min)} - ${toTrieu(max)} Triệu`;
    if (min > 0) return `Từ ${toTrieu(min)} Triệu`;
    if (max > 0) return `Đến ${toTrieu(max)} Triệu`;
    return 'Thỏa thuận';
  }

  function formatDateVN(raw) {
    if (!raw) return 'Đang cập nhật';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw));
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString('vi-VN');
  }

  function formatWorkType(val) {
    const map = {
      full_time: 'Toàn thời gian (Full-time)',
      part_time: 'Bán thời gian (Part-time)',
      internship: 'Thực tập sinh',
      remote: 'Làm việc từ xa (Remote)'
    };
    return map[val] || val || 'Toàn thời gian';
  }

  function formatLevel(val) {
    const map = {
      intern: 'Thực tập sinh',
      fresher: 'Fresher (< 1 năm)',
      junior: 'Junior (1 - 2 năm)',
      middle: 'Middle (2 - 4 năm)',
      senior: 'Senior (4+ năm)',
      lead: 'Trưởng nhóm / Quản lý'
    };
    return map[val] || val || 'Không yêu cầu';
  }

  function resolveLogoUrl(raw, companySlug) {
    const clean = String(raw || '').trim();
    if (clean.startsWith('/assets/')) return '.' + clean;
    if (clean.startsWith('assets/')) return './' + clean;
    if (clean) return clean;
    if (companySlug) return `./assets/images/logos/${companySlug}.png`;
    return '';
  }

  function splitLines(text) {
    if (!text) return [];
    return String(text)
      .split(/\r?\n|•/)
      .map(s => s.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean);
  }

  function renderLoadError(msg) {
    const main = document.getElementById('mainContent');
    if (!main) return;
    main.innerHTML = `
      <div class="container" style="padding: 48px 16px;">
        <div class="jd-section-card" style="text-align:center; padding: 48px 24px;">
          <i class="fa-regular fa-circle-xmark" style="font-size: 3rem; color: #dc2626; margin-bottom: 16px;"></i>
          <h2 style="margin-bottom: 10px;">Không thể hiển thị tin tuyển dụng</h2>
          <p style="color: var(--color-muted); margin-bottom: 24px;">${escapeHtml(msg)}</p>
          <a href="./jobs.html" class="btn btn-primary">Quay lại danh sách việc làm</a>
        </div>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // 1. TẢI DỮ LIỆU THẬT TỪ BACKEND (/api/v1/job-detail/:id)
  // --------------------------------------------------------------------------
  async function loadJobFromApi() {
    if (!API) {
      renderLoadError('API Client chưa sẵn sàng.');
      return null;
    }
    const targetId = currentJobId || '1';
    try {
      const res = await API.get(`/job-detail/${encodeURIComponent(targetId)}`);
      if (!res || !res.success || !res.data) {
        throw new Error(res?.message || 'Không tìm thấy tin tuyển dụng.');
      }
      return res.data;
    } catch (err) {
      renderLoadError(err.message || 'Tin tuyển dụng không tồn tại hoặc máy chủ đang bảo trì.');
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // 2. HYDRATE GIAO DIỆN CHI TIẾT VIỆC LÀM
  // --------------------------------------------------------------------------
  function hydrateJobDetails(data) {
    const salaryText = formatSalary(data.salary_min, data.salary_max, data.currency);
    const workTypeText = formatWorkType(data.employment_type);
    const levelText = formatLevel(data.experience_level);
    const deadlineText = formatDateVN(data.deadline);
    const postedText = formatDateVN(data.created_at);
    const logoSrc = resolveLogoUrl(data.logo_url, data.company_slug);
    const shortName = String(data.company_name || 'JP').slice(0, 3).toUpperCase();

    document.title = `${data.title} — ${data.company_name} | JobPortal`;

    const crumb = document.getElementById('crumbJobTitle');
    if (crumb) crumb.textContent = data.title;

    const jobLogoBox = document.getElementById('jobLogoBox');
    if (jobLogoBox) {
      jobLogoBox.style.background = '#ffffff';
      jobLogoBox.style.border = '1px solid var(--color-border)';
      if (logoSrc) {
        jobLogoBox.innerHTML = `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(data.company_name)}" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline';" /><span style="display:none;color:var(--color-primary);">${escapeHtml(shortName)}</span>`;
      } else {
        jobLogoBox.textContent = shortName;
      }
    }

    const jobTitleEl = document.getElementById('jobTitle');
    if (jobTitleEl) jobTitleEl.textContent = data.title;

    const jobCompanyEl = document.getElementById('jobCompany');
    if (jobCompanyEl) {
      jobCompanyEl.innerHTML = `
        <i class="fa-regular fa-building" aria-hidden="true"></i>
        <strong>${escapeHtml(data.company_name)}</strong>
        <span class="badge badge-verified"><i class="fa-solid fa-circle-check"></i> Đã xác thực</span>
        ${data.category_name ? `<span class="badge badge-tech">${escapeHtml(data.category_name)}</span>` : ''}
      `;
    }

    const jobMetaPills = document.getElementById('jobMetaPills');
    if (jobMetaPills) {
      jobMetaPills.innerHTML = `
        <span class="meta-pill meta-pill-salary"><i class="fa-solid fa-money-bill-wave"></i> ${escapeHtml(salaryText)}</span>
        <span class="meta-pill"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(data.location_name || 'Toàn quốc')}</span>
        <span class="meta-pill"><i class="fa-solid fa-briefcase"></i> ${escapeHtml(levelText)}</span>
        <span class="meta-pill"><i class="fa-regular fa-clock"></i> ${escapeHtml(workTypeText)}</span>
        <span class="meta-pill"><i class="fa-regular fa-calendar"></i> Đăng ngày ${escapeHtml(postedText)}</span>
      `;
    }

    const descItems = splitLines(data.description);
    const jdList = document.getElementById('jdDescriptionList');
    if (jdList) {
      jdList.innerHTML = (descItems.length ? descItems : ['Chưa có mô tả chi tiết.']).map(item => `
        <li class="jd-list-item">
          <span class="jd-list-item-bullet" aria-hidden="true">✓</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `).join('');
    }

    const reqItems = splitLines(data.requirements);
    const reqList = document.getElementById('jdRequirementsList');
    if (reqList) {
      reqList.innerHTML = (reqItems.length ? reqItems : ['Trao đổi cụ thể khi phỏng vấn.']).map(item => `
        <li class="jd-list-item">
          <span class="jd-list-item-bullet" aria-hidden="true">✓</span>
          <span>${escapeHtml(item)}</span>
        </li>
      `).join('');
    }

    const tagsContainer = document.getElementById('jdTagsContainer');
    if (tagsContainer) {
      const skills = Array.isArray(data.skills) ? data.skills : [];
      tagsContainer.innerHTML = skills.length
        ? skills.map(s => `<span class="badge badge-tech">${escapeHtml(s.skill_name)}</span>`).join('')
        : `<span class="badge badge-tech">${escapeHtml(data.category_name || 'Đa ngành')}</span>`;
    }

    const benefitItems = splitLines(data.benefits);
    const benefitsGrid = document.getElementById('jdBenefitsGrid');
    if (benefitsGrid) {
      if (benefitItems.length) {
        benefitsGrid.innerHTML = benefitItems.map((b, i) => `
          <div class="benefit-item">
            <div class="benefit-icon" aria-hidden="true"><i class="fa-solid fa-gift"></i></div>
            <div>
              <div class="benefit-title">Quyền lợi ${i + 1}</div>
              <div class="benefit-desc">${escapeHtml(b)}</div>
            </div>
          </div>
        `).join('');
      } else {
        benefitsGrid.innerHTML = '<p style="color:var(--color-muted);font-size:0.95rem;">Các chế độ phúc lợi theo chính sách của doanh nghiệp và quy định hiện hành.</p>';
      }
    }

    const compName = document.getElementById('compName');
    if (compName) compName.textContent = data.company_name;
    const compDesc = document.getElementById('compDesc');
    if (compDesc) compDesc.textContent = data.company_description || 'Doanh nghiệp đang tuyển dụng nhân sự trên hệ thống JobPortal.';
    const compHq = document.getElementById('compHq');
    if (compHq) compHq.textContent = data.address || data.location_name || 'Việt Nam';
    const compScale = document.getElementById('compScale');
    if (compScale) compScale.textContent = 'Doanh nghiệp xác thực';
    const compFounded = document.getElementById('compFounded');
    if (compFounded) compFounded.textContent = 'Đang tuyển dụng';
    const compWebsite = document.getElementById('compWebsite');
    if (compWebsite) {
      if (data.website) {
        compWebsite.href = data.website;
        compWebsite.textContent = data.website.replace(/^https?:\/\//, '');
        compWebsite.style.display = 'inline-flex';
      } else {
        compWebsite.style.display = 'none';
      }
    }

    const mapVal = {
      stickySalary: salaryText,
      stickyLocation: data.location_name || 'Toàn quốc',
      stickyDeadline: deadlineText,
      stickyExp: levelText,
      stickyQuantity: 'Đang tuyển',
      stickyLevel: levelText,
      stickyWorkType: workTypeText,
      mobileBarSalary: salaryText,
      modalJobTitle: data.title,
      modalJobCompany: data.company_name,
      recruiterName: `Bộ phận Tuyển dụng — ${data.company_name}`,
      recruiterRole: data.category_name || 'Phòng Nhân sự',
      recruiterEmail: 'Liên hệ qua cổng ứng tuyển trực tuyến'
    };
    Object.entries(mapVal).forEach(([id, val]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = val;
    });

    renderSimilarJobs(Array.isArray(data.relatedJobs) ? data.relatedJobs : []);
  }

  function renderSimilarJobs(relatedJobs) {
    const similarContainer = document.getElementById('similarJobsContainer');
    if (!similarContainer) return;

    if (!relatedJobs.length) {
      similarContainer.innerHTML = '<p style="color:var(--color-muted);font-size:0.95rem;">Hiện chưa có tin tuyển dụng tương tự trong cùng ngành nghề.</p>';
      return;
    }

    similarContainer.innerHTML = relatedJobs.map(sJob => {
      const sLogoSrc = resolveLogoUrl(sJob.logo_url);
      const short = String(sJob.company_name || 'JP').slice(0, 3).toUpperCase();
      const sSalary = formatSalary(sJob.salary_min, sJob.salary_max, sJob.currency);
      return `
        <article class="job-listing-item" style="padding: 16px 20px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="company-logo-box" style="width: 44px; height: 44px; font-size: 0.9rem; background: #ffffff; border: 1px solid var(--color-border);">
                ${sLogoSrc ? `<img src="${escapeHtml(sLogoSrc)}" alt="${escapeHtml(sJob.company_name)}" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline';" /><span style="display:none;">${escapeHtml(short)}</span>` : escapeHtml(short)}
              </div>
              <div>
                <h4 style="font-size: 1.05rem; font-weight: 700; margin: 0 0 2px;">
                  <a href="./job-detail.html?id=${sJob.job_id}" style="color: var(--color-dark);">${escapeHtml(sJob.title)}</a>
                </h4>
                <div style="font-size: var(--text-xs); color: var(--color-muted);"><i class="fa-regular fa-building" aria-hidden="true"></i> ${escapeHtml(sJob.company_name)}</div>
              </div>
            </div>
            <span class="job-item-salary" style="font-size: 0.9rem; padding: 3px 8px;"><i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> ${escapeHtml(sSalary)}</span>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: var(--text-xs); color: var(--color-muted); border-top: 1px solid var(--color-border-light); padding-top: 8px; margin-top: 6px;">
            <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escapeHtml(sJob.location_name || 'Toàn quốc')} • <i class="fa-regular fa-calendar" aria-hidden="true"></i> Hạn nộp: ${escapeHtml(formatDateVN(sJob.deadline))}</span>
            <a href="./job-detail.html?id=${sJob.job_id}" style="color: var(--color-primary); font-weight: 700;">Xem chi tiết <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
          </div>
        </article>
      `;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // 3. TRẠNG THÁI ĐÃ ỨNG TUYỂN & ĐÃ LƯU TỪ BACKEND
  // --------------------------------------------------------------------------
  async function syncCandidateStates() {
    if (!hasAuth() || getSessionRole() !== 'candidate') return;
    try {
      const [appsRes, savedRes] = await Promise.all([
        API.get('/candidate/applications').catch(() => null),
        API.get('/candidate/saved-jobs').catch(() => null)
      ]);
      if (appsRes && Array.isArray(appsRes.data)) {
        appliedJobIds = new Set(appsRes.data.map(a => String(a.job_id)));
      }
      if (savedRes && Array.isArray(savedRes.data)) {
        bookmarks = savedRes.data.map(s => String(s.job_id));
      }
    } catch (_) {}
  }

  function checkApplicationStatus() {
    if (!job) return;
    const role = getSessionRole();
    const applyBtns = document.querySelectorAll('.btn-trigger-apply');

    if (role === 'employer' || role === 'admin') {
      applyBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
        btn.innerHTML = '<i class="fa-solid fa-eye" aria-hidden="true"></i><span>CHẾ ĐỘ XEM (DÀNH CHO ỨNG VIÊN)</span>';
      });
      return;
    }

    const isApplied = appliedJobIds.has(String(job.job_id));
    applyBtns.forEach(btn => {
      if (isApplied) {
        btn.classList.add('is-applied');
        btn.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i><span>ĐÃ NỘP HỒ SƠ ỨNG TUYỂN</span>';
        btn.disabled = true;
      } else {
        btn.classList.remove('is-applied');
        btn.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i><span>ỨNG TUYỂN NGAY</span>';
        btn.disabled = false;
      }
    });
  }

  function updateBookmarkUI() {
    const btnBookmark = document.getElementById('btnBookmarkJob');
    if (!btnBookmark || !job) return;
    const isBookmarked = bookmarks.includes(String(job.job_id));
    if (isBookmarked) {
      btnBookmark.innerHTML = '<i class="fa-solid fa-bookmark"></i><span>Đã Lưu Tin</span>';
      btnBookmark.style.borderColor = 'var(--color-primary)';
      btnBookmark.style.color = 'var(--color-primary)';
    } else {
      btnBookmark.innerHTML = '<i class="fa-regular fa-bookmark"></i><span>Lưu Tin Tuyển Dụng</span>';
      btnBookmark.style.borderColor = '';
      btnBookmark.style.color = '';
    }
  }

  // --------------------------------------------------------------------------
  // 4. MODAL NỘP ĐƠN THẬT LÊN API (POST /api/v1/job-detail/:id/apply)
  // --------------------------------------------------------------------------
  const applyModal = document.getElementById('applyModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnCancelModal = document.getElementById('btnCancelModal');
  const dropzone = document.getElementById('cvDropzone');
  const fileInput = document.getElementById('cvFileInput');
  const fileSelectedBadge = document.getElementById('fileSelectedBadge');
  const selectedFileName = document.getElementById('selectedFileName');
  const btnRemoveFile = document.getElementById('btnRemoveFile');

  function openModal() {
    if (!applyModal) return;
    const sess = getSession();
    if (sess) {
      const nInput = document.getElementById('applicantName');
      const eInput = document.getElementById('applicantEmail');
      if (nInput && !nInput.value) nInput.value = sess.fullName || sess.name || '';
      if (eInput && !eInput.value) eInput.value = sess.email || '';
    }
    applyModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!applyModal) return;
    applyModal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.btn-trigger-apply').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const role = getSessionRole();
      if (role === 'guest') {
        if (window.showToast) window.showToast('Vui lòng đăng nhập tài khoản Ứng viên để nộp hồ sơ!', 'warning');
        setTimeout(() => { window.location.href = './auth.html?mode=login'; }, 800);
        return;
      }
      if (role !== 'candidate' || !job) return;
      if (appliedJobIds.has(String(job.job_id))) {
        if (window.showToast) window.showToast('Bạn đã nộp hồ sơ cho vị trí này rồi!', 'info');
        return;
      }
      openModal();
    });
  });

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelModal) btnCancelModal.addEventListener('click', closeModal);
  if (applyModal) {
    applyModal.addEventListener('click', e => {
      if (e.target === applyModal) closeModal();
    });
  }

  function handleFileSelection(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      if (window.showToast) window.showToast('Hệ thống chỉ chấp nhận tệp CV định dạng .PDF!', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (window.showToast) window.showToast('Dung lượng tệp vượt quá giới hạn 5MB!', 'error');
      return;
    }
    currentUploadedFile = file;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    if (selectedFileName && fileSelectedBadge && dropzone) {
      selectedFileName.textContent = `${file.name} (${sizeInMb} MB)`;
      fileSelectedBadge.style.display = 'flex';
      dropzone.style.display = 'none';
    }
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    ['dragenter', 'dragover'].forEach(ev => dropzone.addEventListener(ev, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach(ev => dropzone.addEventListener(ev, e => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('is-dragover');
    }));
    dropzone.addEventListener('drop', e => {
      if (e.dataTransfer.files?.length) handleFileSelection(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', function () {
      if (this.files?.length) handleFileSelection(this.files[0]);
    });
  }

  if (btnRemoveFile) {
    btnRemoveFile.addEventListener('click', () => {
      currentUploadedFile = null;
      if (fileInput) fileInput.value = '';
      if (fileSelectedBadge) fileSelectedBadge.style.display = 'none';
      if (dropzone) dropzone.style.display = 'block';
    });
  }

  const applyForm = document.getElementById('applyJobForm');
  const btnSubmitApplication = document.getElementById('btnSubmitApplication');
  if (applyForm) {
    applyForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!job) return;

      const coverLetter = (document.getElementById('applicantCoverLetter')?.value || '').trim();
      if (!currentUploadedFile) {
        if (window.showToast) window.showToast('Vui lòng đính kèm tệp CV định dạng PDF trước khi nộp đơn!', 'warning');
        return;
      }

      if (btnSubmitApplication) {
        btnSubmitApplication.disabled = true;
        btnSubmitApplication.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i><span>Đang gửi hồ sơ...</span>';
      }

      try {
        const formData = new FormData();
        formData.append('cvFile', currentUploadedFile);
        formData.append('cover_letter', coverLetter);

        const res = await API.upload(`/job-detail/${job.job_id}/apply`, formData);
        appliedJobIds.add(String(job.job_id));
        closeModal();
        checkApplicationStatus();
        if (window.showToast) {
          window.showToast(res?.message || `Nộp hồ sơ thành công cho vị trí "${job.title}"!`, 'success');
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast(err?.message || 'Lỗi nộp hồ sơ ứng tuyển.', 'error');
        }
      } finally {
        if (btnSubmitApplication) {
          btnSubmitApplication.disabled = false;
          btnSubmitApplication.innerHTML = '<i class="fa-solid fa-paper-plane" aria-hidden="true"></i><span>Xác Nhận Nộp Đơn</span>';
        }
      }
    });
  }

  // Bookmark button
  const btnBookmark = document.getElementById('btnBookmarkJob');
  if (btnBookmark) {
    const role = getSessionRole();
    if (role === 'employer' || role === 'admin') {
      btnBookmark.style.display = 'none';
    } else {
      btnBookmark.addEventListener('click', async function () {
        if (!job) return;
        if (!hasAuth() || getSessionRole() !== 'candidate') {
          if (window.showToast) window.showToast('Vui lòng đăng nhập tài khoản Ứng viên để lưu tin!', 'warning');
          setTimeout(() => { window.location.href = './auth.html?mode=login'; }, 800);
          return;
        }
        const idStr = String(job.job_id);
        const isSaving = !bookmarks.includes(idStr);
        try {
          btnBookmark.disabled = true;
          if (isSaving) {
            await API.post(`/candidate/saved-jobs/${job.job_id}`);
            bookmarks.push(idStr);
            if (window.showToast) window.showToast(`Đã lưu tin "${job.title}"!`, 'success');
          } else {
            await API.delete(`/candidate/saved-jobs/${job.job_id}`);
            bookmarks = bookmarks.filter(id => id !== idStr);
            if (window.showToast) window.showToast(`Đã bỏ lưu tin "${job.title}".`, 'info');
          }
          updateBookmarkUI();
        } catch (err) {
          if (window.showToast) window.showToast(err?.message || 'Không thể cập nhật trạng thái lưu tin.', 'error');
        } finally {
          btnBookmark.disabled = false;
        }
      });
    }
  }

  // Share button
  const btnShare = document.getElementById('btnShareJob');
  if (btnShare) {
    btnShare.addEventListener('click', function () {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => window.showToast && window.showToast('Đã sao chép liên kết tuyển dụng!', 'success'))
          .catch(() => {});
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. KHỞI CHẠY
  // --------------------------------------------------------------------------
  job = await loadJobFromApi();
  if (!job) return;

  await syncCandidateStates();
  hydrateJobDetails(job);
  checkApplicationStatus();
  updateBookmarkUI();
});
