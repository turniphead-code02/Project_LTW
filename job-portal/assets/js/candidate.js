/**
 * ==========================================================================
 * MODULE 3: BẢNG ĐIỀU KHIỂN & HỒ SƠ ỨNG VIÊN (CANDIDATE DASHBOARD SCRIPT)
 * --------------------------------------------------------------------------
 * Thành viên đảm nhiệm: NGUYỄN PHÚ QUANG
 * Mã số sinh viên (MSSV): 036206029474
 * Nhóm 6 — Lập trình Website — GVHD: ThS. Trần Thịnh Mạnh Đức — UTH
 * Thiết kế chuẩn: Wireframe Mục 5.4 Phân Hệ Ứng Viên (QTTK.html)
 * 
 * TÍNH NĂNG CHÍNH:
 *   1. Quản lý thông tin cá nhân (Đồng bộ MySQL qua /api/v1/candidate/profile)
 *   2. Quản lý học vấn (Thêm, xóa, hiển thị danh sách trường học)
 *   3. Quản lý kỹ năng (Thêm, xóa thẻ kỹ năng, gợi ý tag nhanh)
 *   4. Quản lý kho CV (Upload file PDF thật qua /candidate/resumes, đặt CV mặc định, xóa CV và file đĩa)
 *   5. Quản lý liên kết cá nhân (Portfolio, GitHub)
 *   6. Tính toán % độ hoàn thiện hồ sơ động (Profile Completion Engine)
 *   7. Theo dõi vòng đời đơn ứng tuyển với Stepper 4 bước (/candidate/applications)
 *   8. Xem & quản lý việc làm đã lưu (/candidate/saved-jobs)
 *   9. Cơ chế Graceful Fallback: Ưu tiên API Backend, tự động fallback LocalStorage nếu offline
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const API = window.JobPortalAPI;

  // --------------------------------------------------------------------------
  // 1. STORAGE KEYS & CẤU HÌNH DỮ LIỆU
  // --------------------------------------------------------------------------
  const STORAGE_KEYS = {
    SESSION: 'jobportal_session',
    PROFILE: 'jobportal_candidate_profile',
    EDUCATION: 'jobportal_candidate_education',
    SKILLS: 'jobportal_candidate_skills',
    RESUMES: 'jobportal_candidate_resumes',
    LINKS: 'jobportal_candidate_links',
    APPLICATIONS: 'jobportal_applied_jobs',
    BOOKMARKS: 'jobportal_bookmarks'
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
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage:', key, e);
      return fallback;
    }
  }

  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Lỗi ghi LocalStorage:', key, e);
    }
  }

  function notify(msg, type = 'success') {
    if (typeof window.showToast === 'function') {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  // --------------------------------------------------------------------------
  // 2. KHỞI TẠO DỮ LIỆU MẶC ĐỊNH
  // --------------------------------------------------------------------------
  const session = getStorage(STORAGE_KEYS.SESSION, null);
  const initialName = (session && (session.fullName || session.name)) || 'Nguyễn Phú Quang';
  const initialEmail = (session && session.email) || 'quang.np@student.ut.edu.vn';

  let profile = getStorage(STORAGE_KEYS.PROFILE, {
    fullName: initialName,
    email: initialEmail,
    phone: '0901 234 567',
    location: 'hcm',
    title: 'Frontend Web Developer (Fresher / Junior)',
    bio: 'Sinh viên CNTT trường ĐH Giao Thông Vận Tải TP.HCM (UTH). Đam mê lập trình Web hiện đại với HTML5, CSS3, JavaScript và React.'
  });

  let educations = getStorage(STORAGE_KEYS.EDUCATION, [
    {
      id: 'edu-1',
      school: 'Trường ĐH Giao Thông Vận Tải TP.HCM (UTH)',
      major: 'Công Nghệ Thông Tin (Khoa CNTT)',
      startYear: '2022',
      endYear: '2026'
    }
  ]);

  let skills = getStorage(STORAGE_KEYS.SKILLS, [
    'HTML5 Semantic', 'CSS3 Modern', 'JavaScript ES6+', 'ReactJS', 'Responsive Web Design', 'Git / GitHub', 'Figma', 'Bootstrap 5'
  ]);

  let resumes = getStorage(STORAGE_KEYS.RESUMES, [
    {
      id: 'res-1',
      title: 'CV_NguyenPhuQuang_Frontend_2026.pdf',
      fileName: 'CV_NguyenPhuQuang_Frontend.pdf',
      fileSize: '1.45 MB',
      uploadDate: '26/10/2026',
      isDefault: true
    }
  ]);

  let links = getStorage(STORAGE_KEYS.LINKS, {
    portfolio: '../portfolios/NguyenPhuQuang/index.html',
    github: 'https://github.com/nguyenphuquang'
  });

  let applications = getStorage(STORAGE_KEYS.APPLICATIONS, []);

  // --------------------------------------------------------------------------
  // 3. ĐỒNG BỘ HIỂN THỊ PROFILE & HEADER
  // --------------------------------------------------------------------------
  function renderProfileHeader() {
    const headerUserName = document.getElementById('headerUserName');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarAvatar = document.querySelector('.profile-avatar');
    const headerAvatar = document.querySelector('.user-avatar');

    const displayName = profile.fullName || 'Nguyễn Phú Quang';
    const firstChar = displayName.trim().charAt(0).toUpperCase() || 'Q';

    if (headerUserName) headerUserName.textContent = displayName;
    if (sidebarUserName) sidebarUserName.textContent = displayName;
    if (sidebarAvatar) sidebarAvatar.textContent = firstChar;
    if (headerAvatar) headerAvatar.textContent = firstChar;

    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const locationSelect = document.getElementById('location');

    if (fullNameInput) fullNameInput.value = profile.fullName || '';
    if (emailInput) emailInput.value = profile.email || '';
    if (phoneInput) phoneInput.value = profile.phone || '';
    if (locationSelect && profile.location) locationSelect.value = profile.location;
  }

  // --------------------------------------------------------------------------
  // 4. TÍNH TOÁN ĐỘ HOÀN THIỆN HỒ SƠ
  // --------------------------------------------------------------------------
  function updateProfileCompletion() {
    let score = 0;

    if (profile.fullName && profile.phone && profile.location) {
      score += 25;
    } else if (profile.fullName) {
      score += 15;
    }

    if (educations && educations.length > 0) score += 20;
    if (skills && skills.length >= 3) score += 20;
    else if (skills && skills.length > 0) score += 10;

    if (resumes && resumes.length > 0) score += 25;
    if (links && (links.portfolio || links.github)) score += 10;

    score = Math.min(score, 100);

    const completionPercent = document.getElementById('completionPercent');
    const progressFill = document.getElementById('progressFill');
    const progressTrack = document.getElementById('completionProgress');

    if (completionPercent) completionPercent.textContent = score + '%';
    if (progressFill) progressFill.style.width = score + '%';
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', score);
  }

  // --------------------------------------------------------------------------
  // 5. CHỈNH SỬA & LƯU THÔNG TIN CÁ NHÂN (PROFILE)
  // --------------------------------------------------------------------------
  const editProfileBtn = document.getElementById('editProfileBtn');
  const profileForm = document.getElementById('profileForm');
  const profileActions = document.getElementById('profileActions');
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  const editableInputs = [
    document.getElementById('fullName'),
    document.getElementById('phone'),
    document.getElementById('location')
  ];

  function toggleProfileEdit(enable) {
    editableInputs.forEach(input => {
      if (input) input.disabled = !enable;
    });

    if (profileActions) profileActions.hidden = !enable;
    if (editProfileBtn) editProfileBtn.style.display = enable ? 'none' : 'inline-flex';

    if (enable && editableInputs[0]) {
      editableInputs[0].focus();
    }
  }

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => toggleProfileEdit(true));
  }

  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', () => {
      renderProfileHeader();
      toggleProfileEdit(false);
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const location = document.getElementById('location').value;

      if (!fullName) {
        notify('Vui lòng nhập Họ và tên của bạn!', 'error');
        return;
      }

      profile.fullName = fullName;
      profile.phone = phone;
      profile.location = location;

      setStorage(STORAGE_KEYS.PROFILE, profile);

      if (session) {
        session.fullName = fullName;
        session.name = fullName;
        setStorage(STORAGE_KEYS.SESSION, session);
      }

      // Đồng bộ sang API Backend nếu có đăng nhập
      if (hasAuth()) {
        try {
          await API.put('/candidate/profile', { full_name: fullName, phone });
        } catch (apiErr) {
          console.warn('[API] Lưu hồ sơ lên máy chủ thất bại:', apiErr.message);
        }
      }

      renderProfileHeader();
      toggleProfileEdit(false);
      updateProfileCompletion();
      notify('Cập nhật thông tin cá nhân thành công!', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 6. XỬ LÝ HỌC VẤN (EDUCATION)
  // --------------------------------------------------------------------------
  const educationList = document.getElementById('educationList');
  const addEducationBtn = document.getElementById('addEducationBtn');
  const educationForm = document.getElementById('educationForm');
  const cancelEducationBtn = document.getElementById('cancelEducationBtn');

  function renderEducations() {
    if (!educationList) return;

    if (educations.length === 0) {
      educationList.innerHTML = '<p style="font-size: 0.875rem; color: var(--color-muted); padding: 8px 0;">Chưa có thông tin học vấn. Bấm nút "+ Thêm" bên trên để bổ sung.</p>';
      return;
    }

    educationList.innerHTML = educations.map(edu => `
      <div class="education-item" data-id="${edu.id}">
        <div class="education-item-content">
          <h3>${edu.school}</h3>
          <p class="education-major">${edu.major}</p>
          <span class="education-years"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${edu.startYear} — ${edu.endYear || 'Hiện tại'}</span>
        </div>
        <button type="button" class="btn-delete-item btn-delete-edu" data-id="${edu.id}" title="Xóa học vấn này" aria-label="Xóa học vấn">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    educationList.querySelectorAll('.btn-delete-edu').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        educations = educations.filter(item => item.id !== id);
        setStorage(STORAGE_KEYS.EDUCATION, educations);
        renderEducations();
        updateProfileCompletion();
        notify('Đã xóa thông tin học vấn.', 'warning');
      });
    });
  }

  if (addEducationBtn && educationForm) {
    addEducationBtn.addEventListener('click', () => {
      educationForm.hidden = false;
      addEducationBtn.style.display = 'none';
      const schoolInput = document.getElementById('schoolName');
      if (schoolInput) schoolInput.focus();
    });
  }

  if (cancelEducationBtn && educationForm && addEducationBtn) {
    cancelEducationBtn.addEventListener('click', () => {
      educationForm.reset();
      educationForm.hidden = true;
      addEducationBtn.style.display = 'inline-flex';
    });
  }

  if (educationForm) {
    educationForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const school = document.getElementById('schoolName').value.trim();
      const major = document.getElementById('major').value.trim();
      const startYear = document.getElementById('startYear').value.trim();
      const endYear = document.getElementById('endYear').value.trim();

      if (!school || !major || !startYear) {
        notify('Vui lòng điền đủ tên trường, ngành học và năm bắt đầu!', 'error');
        return;
      }

      educations.push({
        id: 'edu-' + Date.now(),
        school,
        major,
        startYear,
        endYear: endYear || 'Hiện tại'
      });
      setStorage(STORAGE_KEYS.EDUCATION, educations);

      educationForm.reset();
      educationForm.hidden = true;
      if (addEducationBtn) addEducationBtn.style.display = 'inline-flex';

      renderEducations();
      updateProfileCompletion();
      notify('Đã thêm học vấn mới thành công!', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 7. XỬ LÝ KỸ NĂNG (SKILLS)
  // --------------------------------------------------------------------------
  const skillsList = document.getElementById('skillsList');
  const skillForm = document.getElementById('skillForm');
  const skillInput = document.getElementById('skillInput');

  function renderSkills() {
    if (!skillsList) return;

    if (skills.length === 0) {
      skillsList.innerHTML = '<p style="font-size: 0.875rem; color: var(--color-muted);">Chưa có kỹ năng nào. Nhập kỹ năng vào ô trên để thêm.</p>';
      return;
    }

    skillsList.innerHTML = skills.map((skill, index) => `
      <span class="skill-chip">
        <span>${skill}</span>
        <button type="button" class="skill-chip-delete" data-index="${index}" aria-label="Xóa kỹ năng ${skill}">
          &times;
        </button>
      </span>
    `).join('');

    skillsList.querySelectorAll('.skill-chip-delete').forEach(btn => {
      btn.addEventListener('click', function () {
        const index = parseInt(this.getAttribute('data-index'), 10);
        skills.splice(index, 1);
        setStorage(STORAGE_KEYS.SKILLS, skills);
        renderSkills();
        updateProfileCompletion();
      });
    });
  }

  function addSkill(newSkill) {
    const trimmed = newSkill.trim();
    if (!trimmed) return;

    const exists = skills.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      notify(`Kỹ năng "${trimmed}" đã có trong danh sách!`, 'warning');
      return;
    }

    skills.push(trimmed);
    setStorage(STORAGE_KEYS.SKILLS, skills);
    renderSkills();
    updateProfileCompletion();
    notify(`Đã thêm kỹ năng "${trimmed}".`, 'success');
  }

  if (skillForm && skillInput) {
    skillForm.addEventListener('submit', function (e) {
      e.preventDefault();
      addSkill(skillInput.value);
      skillInput.value = '';
    });
  }

  const skillsSection = document.getElementById('skillsSection');
  if (skillsSection) {
    const suggestedWrap = document.createElement('div');
    suggestedWrap.className = 'suggested-skills';
    suggestedWrap.innerHTML = `
      <p><i class="fa-regular fa-lightbulb" style="color: var(--color-primary);"></i> Gợi ý kỹ năng ngành IT:</p>
      <div>
        <button type="button" class="suggest-btn" data-skill="TypeScript">+ TypeScript</button>
        <button type="button" class="suggest-btn" data-skill="Node.js">+ Node.js</button>
        <button type="button" class="suggest-btn" data-skill="TailwindCSS">+ TailwindCSS</button>
        <button type="button" class="suggest-btn" data-skill="PostgreSQL">+ PostgreSQL</button>
        <button type="button" class="suggest-btn" data-skill="Docker">+ Docker</button>
        <button type="button" class="suggest-btn" data-skill="RESTful API">+ RESTful API</button>
      </div>
    `;
    skillsSection.appendChild(suggestedWrap);

    suggestedWrap.querySelectorAll('.suggest-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        addSkill(this.getAttribute('data-skill'));
      });
    });
  }

  // --------------------------------------------------------------------------
  // 8. XỬ LÝ KHO CV & UPLOAD TỆP PDF QUA REST API
  // --------------------------------------------------------------------------
  const resumeList = document.getElementById('resumeList');
  const uploadResumeBtn = document.getElementById('uploadResumeBtn');
  const resumeFileInput = document.getElementById('resumeFile');
  const resumeFileName = document.getElementById('resumeFileName');
  const resumeUploadArea = document.querySelector('.resume-upload');

  function renderResumes() {
    if (!resumeList) return;

    if (resumes.length === 0) {
      resumeList.innerHTML = '<p style="font-size: 0.875rem; color: var(--color-muted);">Bạn chưa có CV nào trong kho. Vui lòng tải lên CV định dạng PDF bên dưới.</p>';
      return;
    }

    resumeList.innerHTML = resumes.map(res => `
      <div class="resume-card-item ${res.isDefault ? 'is-default' : ''}" data-id="${res.id}">
        <div class="resume-item-main">
          <i class="fa-solid fa-file-pdf resume-pdf-icon" aria-hidden="true"></i>
          <div class="resume-title-wrap">
            <h3>
              <span>${res.title}</span>
              ${res.isDefault ? '<span class="badge-default-cv">✓ CV Mặc Định</span>' : ''}
            </h3>
            <div class="resume-sub-meta">
              <span><i class="fa-solid fa-file-arrow-up" aria-hidden="true"></i> ${res.fileSize || 'PDF'}</span> • <span><i class="fa-regular fa-calendar" aria-hidden="true"></i> Tải lên: ${res.uploadDate || 'Mới đây'}</span>
            </div>
          </div>
        </div>
        <div class="resume-actions-group">
          ${!res.isDefault ? `
            <button type="button" class="btn-outline btn-sm btn-set-default" data-id="${res.id}">
              Đặt làm mặc định
            </button>
          ` : ''}
          <button type="button" class="btn-outline btn-sm btn-download-cv" data-id="${res.id}" data-url="${res.fileUrl || ''}" title="Tải CV về máy">
            <i class="fa-solid fa-download"></i>
          </button>
          <button type="button" class="btn-delete-item btn-delete-cv" data-id="${res.id}" title="Xóa CV này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Đặt CV mặc định qua API
    resumeList.querySelectorAll('.btn-set-default').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.getAttribute('data-id');

        // Nếu đã đăng nhập: Đồng bộ trực tiếp với CSDL máy chủ
        if (hasAuth()) {
          if (!isNaN(Number(id))) {
            const originalText = btn.textContent;
            try {
              btn.disabled = true;
              btn.textContent = 'Đang lưu...';
              await API.patch(`/candidate/resumes/${id}/default`);
              resumes.forEach(r => { r.isDefault = (String(r.id) === String(id)); });
              setStorage(STORAGE_KEYS.RESUMES, resumes);
              renderResumes();
              notify('Đã cập nhật CV mặc định trên máy chủ thành công!', 'success');
            } catch (err) {
              console.warn('[API] Lỗi đổi CV mặc định:', err.message);
              notify('Lỗi đặt CV mặc định: ' + (err.message || 'Không thể kết nối máy chủ'), 'error');
              btn.disabled = false;
              btn.textContent = originalText;
            }
          } else {
            notify('CV này chưa được lưu trên hệ thống máy chủ.', 'warning');
          }
          return;
        }

        // Chế độ ngoại tuyến (chưa đăng nhập)
        resumes.forEach(r => { r.isDefault = (String(r.id) === String(id)); });
        setStorage(STORAGE_KEYS.RESUMES, resumes);
        renderResumes();
        notify('Đã cập nhật CV mặc định để nộp đơn tuyển dụng!', 'success');
      });
    });

    // Tải về / Mở file PDF (Kèm Token xác thực để truy cập API bảo mật /uploads/cv)
    resumeList.querySelectorAll('.btn-download-cv').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const url = this.getAttribute('data-url');
        const r = resumes.find(item => String(item.id) === String(id));
        if (url) {
          let fullUrl = url.startsWith('http') ? url : (API ? API.BASE_URL.replace('/api/v1', '') + url : url);
          const token = (typeof API !== 'undefined' && API.getToken) ? API.getToken() : (localStorage.getItem('jobportal_access_token') || '');
          if (token) {
            const sep = fullUrl.includes('?') ? '&' : '?';
            fullUrl = `${fullUrl}${sep}token=${encodeURIComponent(token)}`;
          }
          window.open(fullUrl, '_blank');
        } else {
          notify(`Đang tải xuống tệp: ${r ? r.title : 'CV.pdf'}...`, 'info');
        }
      });
    });

    // Xóa CV qua API (có xóa file vật lý trên server)
    resumeList.querySelectorAll('.btn-delete-cv').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.getAttribute('data-id');
        if (!confirm('Bạn có chắc chắn muốn xóa tệp CV này khỏi kho hồ sơ?')) return;

        // Nếu đã đăng nhập: Gọi API xóa trên máy chủ thật
        if (hasAuth()) {
          if (!isNaN(Number(id))) {
            try {
              btn.disabled = true;
              const res = await API.delete(`/candidate/resumes/${id}`);
              resumes = resumes.filter(item => String(item.id) !== String(id));

              // Nếu máy chủ tự động chuyển CV khác làm mặc định (khi xóa CV mặc định)
              if (res && res.data && res.data.new_default_resume_id) {
                resumes.forEach(r => {
                  r.isDefault = (String(r.id) === String(res.data.new_default_resume_id));
                });
              } else if (resumes.length > 0 && !resumes.some(r => r.isDefault)) {
                resumes[0].isDefault = true;
              }

              setStorage(STORAGE_KEYS.RESUMES, resumes);
              renderResumes();
              updateProfileCompletion();
              notify('Đã xóa CV khỏi kho hồ sơ máy chủ thành công.', 'warning');
            } catch (err) {
              console.warn('[API] Lỗi xóa CV trên máy chủ:', err.message);
              notify('Lỗi xóa CV: ' + (err.message || 'Không thể xóa CV trên máy chủ'), 'error');
              btn.disabled = false;
            }
          } else {
            notify('CV này không tồn tại trên hệ thống máy chủ.', 'warning');
          }
          return;
        }

        // Chế độ ngoại tuyến (chưa đăng nhập)
        resumes = resumes.filter(item => String(item.id) !== String(id));
        if (resumes.length > 0 && !resumes.some(r => r.isDefault)) {
          resumes[0].isDefault = true;
        }
        setStorage(STORAGE_KEYS.RESUMES, resumes);
        renderResumes();
        updateProfileCompletion();
        notify('Đã xóa CV khỏi kho hồ sơ.', 'warning');
      });
    });
  }

  if (uploadResumeBtn && resumeFileInput) {
    uploadResumeBtn.addEventListener('click', () => resumeFileInput.click());
  }

  if (resumeFileInput) {
    resumeFileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        handleResumeUpload(this.files[0]);
      }
    });
  }

  if (resumeUploadArea) {
    ['dragenter', 'dragover'].forEach(name => {
      resumeUploadArea.addEventListener(name, (e) => {
        e.preventDefault();
        resumeUploadArea.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      resumeUploadArea.addEventListener(name, (e) => {
        e.preventDefault();
        resumeUploadArea.classList.remove('is-dragover');
      });
    });

    resumeUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      resumeUploadArea.classList.remove('is-dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleResumeUpload(e.dataTransfer.files[0]);
      }
    });
  }

  async function handleResumeUpload(file) {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      notify('Hệ thống chỉ chấp nhận tệp hồ sơ định dạng PDF chuẩn (.pdf)!', 'error');
      if (resumeFileInput) resumeFileInput.value = '';
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      notify('Dung lượng tệp vượt quá 5MB. Vui lòng nén nhỏ lại trước khi tải lên!', 'error');
      if (resumeFileInput) resumeFileInput.value = '';
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    if (resumeFileName) {
      resumeFileName.textContent = `Đang tải: ${file.name} (${sizeMb})...`;
    }

    // Nếu đã đăng nhập: Gọi API tải lên máy chủ thật
    if (hasAuth()) {
      try {
        if (uploadResumeBtn) uploadResumeBtn.disabled = true;
        const formData = new FormData();
        formData.append('cvFile', file);
        formData.append('resume_title', file.name);

        const res = await API.upload('/candidate/resumes', formData);
        if (res && res.data) {
          const serverCv = {
            id: res.data.resume_id,
            title: res.data.resume_title || file.name,
            fileName: file.name,
            fileUrl: res.data.file_url,
            fileSize: sizeMb,
            uploadDate: new Date().toLocaleDateString('vi-VN'),
            isDefault: Boolean(res.data.is_default)
          };

          if (serverCv.isDefault) {
            resumes.forEach(r => { r.isDefault = false; });
          }
          resumes.unshift(serverCv);
          setStorage(STORAGE_KEYS.RESUMES, resumes);
          renderResumes();
          updateProfileCompletion();
          if (resumeFileName) resumeFileName.textContent = `Đã tải lên: ${file.name}`;
          notify(`Đã tải lên và thẩm định tệp PDF thành công: ${file.name}!`, 'success');
        } else {
          throw new Error(res?.message || 'Không nhận được dữ liệu phản hồi từ máy chủ.');
        }
      } catch (err) {
        console.warn('[API] Upload CV lỗi:', err.message);
        if (resumeFileName) resumeFileName.textContent = `Tải lên thất bại: ${file.name}`;
        notify('Lỗi tải CV lên máy chủ: ' + (err.message || 'Không thể tải lên'), 'error');
      } finally {
        if (uploadResumeBtn) uploadResumeBtn.disabled = false;
        if (resumeFileInput) resumeFileInput.value = '';
      }
      return; // Bắt buộc return để không rơi xuống fallback ngoại tuyến
    }

    // Fallback nếu chưa kết nối Backend (chưa đăng nhập)
    try {
      const newResume = {
        id: 'res-' + Date.now(),
        title: file.name,
        fileName: file.name,
        fileSize: sizeMb,
        uploadDate: new Date().toLocaleDateString('vi-VN'),
        isDefault: resumes.length === 0
      };

      resumes.unshift(newResume);
      setStorage(STORAGE_KEYS.RESUMES, resumes);
      renderResumes();
      updateProfileCompletion();
      if (resumeFileName) resumeFileName.textContent = `Đã chọn: ${file.name} (${sizeMb})`;
      notify(`Tải lên thành công: ${file.name}!`, 'success');
    } finally {
      if (resumeFileInput) resumeFileInput.value = '';
    }
  }

  // --------------------------------------------------------------------------
  // 9. LIÊN KẾT CÁ NHÂN (PORTFOLIO & GITHUB)
  // --------------------------------------------------------------------------
  const portfolioUrlInput = document.getElementById('portfolioUrl');
  const githubUrlInput = document.getElementById('githubUrl');
  const openPortfolio = document.getElementById('openPortfolio');
  const openGithub = document.getElementById('openGithub');
  const socialLinksForm = document.getElementById('socialLinksForm');

  function renderLinks() {
    if (portfolioUrlInput) portfolioUrlInput.value = links.portfolio || '';
    if (githubUrlInput) githubUrlInput.value = links.github || '';

    if (openPortfolio) {
      if (links.portfolio) {
        openPortfolio.href = links.portfolio;
        openPortfolio.hidden = false;
      } else {
        openPortfolio.hidden = true;
      }
    }

    if (openGithub) {
      if (links.github) {
        openGithub.href = links.github;
        openGithub.hidden = false;
      } else {
        openGithub.hidden = true;
      }
    }
  }

  if (socialLinksForm) {
    socialLinksForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const portfolioVal = portfolioUrlInput ? portfolioUrlInput.value.trim() : '';
      const githubVal = githubUrlInput ? githubUrlInput.value.trim() : '';

      links.portfolio = portfolioVal;
      links.github = githubVal;

      setStorage(STORAGE_KEYS.LINKS, links);
      renderLinks();
      updateProfileCompletion();
      notify('Đã lưu các liên kết cá nhân (Portfolio & GitHub)!', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 10. TABS ĐIỀU HƯỚNG TRONG CANDIDATE DASHBOARD
  // --------------------------------------------------------------------------
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  function switchTab(tabId) {
    sidebarLinks.forEach(link => {
      const active = (link.getAttribute('data-tab') === tabId);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    tabPanels.forEach(panel => {
      const active = (panel.id === tabId);
      panel.classList.toggle('active', active);
    });

    const pageHeadingTitle = document.querySelector('.page-heading h1');
    const pageHeadingDesc = document.querySelector('.page-heading p');

    if (tabId === 'tab-profile') {
      if (pageHeadingTitle) pageHeadingTitle.textContent = 'Hồ sơ cá nhân & Kho CV';
      if (pageHeadingDesc) pageHeadingDesc.textContent = 'Quản lý thông tin hồ sơ, học vấn, kỹ năng, CV và các liên kết chuyên môn.';
    } else if (tabId === 'tab-applications') {
      if (pageHeadingTitle) pageHeadingTitle.textContent = 'Theo dõi đơn ứng tuyển';
      if (pageHeadingDesc) pageHeadingDesc.textContent = 'Theo dõi trạng thái xét duyệt hồ sơ, lịch hẹn phỏng vấn và thông báo kết quả từ nhà tuyển dụng.';
      loadAndRenderApplications();
    } else if (tabId === 'tab-saved') {
      if (pageHeadingTitle) pageHeadingTitle.textContent = 'Việc làm đã lưu';
      if (pageHeadingDesc) pageHeadingDesc.textContent = 'Danh sách các cơ hội nghề nghiệp bạn đã đánh dấu quan tâm.';
      loadAndRenderSavedJobs();
    }

    window.location.hash = tabId.replace('tab-', '');
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetTab = this.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'applications') switchTab('tab-applications');
    else if (hash === 'saved') switchTab('tab-saved');
    else switchTab('tab-profile');
  }

  // --------------------------------------------------------------------------
  // 11. TIẾN TRÌNH 4 BƯỚC TUYỂN DỤNG & STEPPER TIMELINE (MỤC 5.4 QTTK)
  // --------------------------------------------------------------------------
  const stepConfig = {
    pending: { stepIndex: 1, text: 'Đã nộp đơn', badgeColor: '#1e40af', badgeBg: '#eff6ff' },
    viewed: { stepIndex: 2, text: 'Doanh nghiệp đã xem', badgeColor: '#0369a1', badgeBg: '#e0f2fe' },
    interview: { stepIndex: 3, text: 'Hẹn phỏng vấn', badgeColor: '#b45309', badgeBg: '#fef3c7' },
    accepted: { stepIndex: 4, text: 'Trúng tuyển', badgeColor: '#065f46', badgeBg: '#ecfdf5' },
    rejected: { stepIndex: 4, text: 'Chưa phù hợp', badgeColor: '#b91c1c', badgeBg: '#fee2e2' },
    withdrawn: { stepIndex: 1, text: 'Đã rút đơn', badgeColor: '#64748b', badgeBg: '#f1f5f9' }
  };

  async function loadAndRenderApplications() {
    const container = document.getElementById('applicationsContainer');
    if (!container) return;

    if (hasAuth()) {
      try {
        const res = await API.get('/candidate/applications');
        if (res && Array.isArray(res.data)) {
          applications = res.data.map(item => {
            const conf = stepConfig[item.status] || stepConfig.pending;
            return {
              id: item.application_id,
              jobId: item.job_id,
              jobTitle: item.job_title,
              company: item.company_name,
              salary: (item.salary_min && item.salary_max)
                ? `${Math.round(item.salary_min / 1e6)} - ${Math.round(item.salary_max / 1e6)} Triệu`
                : 'Thỏa thuận',
              location: item.location_name || 'Toàn quốc',
              appliedAt: new Date(item.applied_at).toLocaleString('vi-VN'),
              status: item.status,
              statusText: conf.text,
              stepIndex: conf.stepIndex,
              snapshotUrl: item.resume_snapshot_url,
              coverLetter: item.cover_letter
            };
          });
          setStorage(STORAGE_KEYS.APPLICATIONS, applications);
        }
      } catch (err) {
        console.warn('[API] Lỗi tải danh sách đơn ứng tuyển:', err.message);
      }
    }

    renderApplicationsList();
  }

  function renderApplicationsList() {
    const container = document.getElementById('applicationsContainer');
    if (!container) return;

    applications = getStorage(STORAGE_KEYS.APPLICATIONS, applications);

    const appBadge = document.getElementById('sidebarAppCount');
    if (appBadge) appBadge.textContent = applications.length;

    if (applications.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
          <h3>Bạn chưa nộp đơn ứng tuyển nào!</h3>
          <p>Hãy khám phá ngay hơn 5.000+ vị trí việc làm IT hấp dẫn và nộp hồ sơ để bắt đầu hành trình nghề nghiệp.</p>
          <a href="./jobs.html" class="btn-primary" style="text-decoration:none;">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span>Khám phá việc làm ngay</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = applications.map(app => {
      const step = app.stepIndex || 1;
      const conf = stepConfig[app.status] || stepConfig.pending;

      return `
        <article class="dashboard-card" style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
            <div>
              <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-dark); margin-bottom: 4px;">
                <a href="./job-detail.html?id=${app.jobId}" style="color: inherit; text-decoration: none;">${app.jobTitle}</a>
              </h2>
              <div style="font-size: 0.875rem; color: var(--color-muted); display: flex; gap: 12px; flex-wrap: wrap;">
                <span><i class="fa-regular fa-building" aria-hidden="true"></i> <strong>${app.company}</strong></span>
                <span><i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> ${app.salary || 'Thương lượng'}</span>
                <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${app.location || 'TP.HCM'}</span>
              </div>
            </div>
            <div>
              <span class="candidate-badge" style="background:${conf.badgeBg}; color:${conf.badgeColor};">
                ${app.statusText || 'Đã nộp đơn'}
              </span>
            </div>
          </div>

          <div style="background: var(--color-bg-page); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 14px; margin: 14px 0; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span><i class="fa-solid fa-file-pdf" style="color: var(--color-danger);"></i> Bản chụp CV bất biến: <strong>${app.fileName || 'CV_Snapshot.pdf'}</strong></span>
            <span style="color: var(--color-muted);"><i class="fa-regular fa-clock" aria-hidden="true"></i> Nộp lúc: ${app.appliedAt}</span>
          </div>

          <!-- STEPPER 4 BƯỚC -->
          <div class="stepper-timeline-box">
            <div class="stepper-track">
              <div class="step-node ${step >= 1 ? 'completed' : 'pending'}">
                <div class="step-icon-bubble">${step >= 1 ? '✓' : '1'}</div>
                <div class="step-label-title">1. ĐÃ NỘP ĐƠN</div>
                <div class="step-label-desc">${app.appliedAt.slice(0, 10)}</div>
              </div>

              <div class="step-line ${step >= 2 ? 'completed' : ''}"></div>

              <div class="step-node ${step >= 2 ? (step === 2 ? 'active' : 'completed') : 'pending'}">
                <div class="step-icon-bubble">${step > 2 ? '✓' : '2'}</div>
                <div class="step-label-title">2. ĐÃ XEM CV</div>
                <div class="step-label-desc">${step >= 2 ? 'Nhà tuyển dụng' : 'Đang chờ'}</div>
              </div>

              <div class="step-line ${step >= 3 ? 'completed' : ''}"></div>

              <div class="step-node ${step >= 3 ? (step === 3 ? 'active' : 'completed') : 'pending'}">
                <div class="step-icon-bubble">${step > 3 ? '✓' : '3'}</div>
                <div class="step-label-title">3. PHỎNG VẤN</div>
                <div class="step-label-desc">${step >= 3 ? 'Đã xếp lịch' : 'Chưa xếp'}</div>
              </div>

              <div class="step-line ${step >= 4 ? 'completed' : ''}"></div>

              <div class="step-node ${step >= 4 ? 'completed' : 'pending'}">
                <div class="step-icon-bubble">${step >= 4 ? '✓' : '4'}</div>
                <div class="step-label-title">4. KẾT QUẢ</div>
                <div class="step-label-desc">${step >= 4 ? (app.status === 'accepted' ? 'Trúng tuyển' : 'Hoàn tất') : 'Đang duyệt'}</div>
              </div>
            </div>
          </div>

          ${app.coverLetter ? `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; font-size: 0.85rem; color: #334155; margin-bottom: 14px;">
              <strong><i class="fa-regular fa-envelope" aria-hidden="true"></i> Thư giới thiệu:</strong> ${app.coverLetter}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; border-top: 1px solid var(--color-border-light); padding-top: 12px;">
            <a href="./job-detail.html?id=${app.jobId}" class="btn-outline btn-sm" style="text-decoration:none;">
              Xem lại tin tuyển dụng
            </a>
            ${app.status !== 'withdrawn' && app.status !== 'accepted' && app.status !== 'rejected' ? `
              <button type="button" class="btn-delete-item btn-withdraw-app" data-id="${app.id}" style="color:var(--color-danger); border:1px solid #fee2e2; padding:4px 10px; border-radius:6px; font-size:0.8rem; cursor:pointer;">
                Rút đơn ứng tuyển
              </button>
            ` : (app.status === 'withdrawn' ? `
              <span style="font-size:0.8rem; color:#64748b; font-weight:600; padding:4px 8px; background:#f1f5f9; border-radius:6px;">
                <i class="fa-solid fa-ban"></i> Đã rút hồ sơ
              </span>
            ` : '')}
          </div>
        </article>
      `;
    }).join('');

    // Sự kiện rút đơn
    container.querySelectorAll('.btn-withdraw-app').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.getAttribute('data-id');
        if (!confirm('Bạn có chắc chắn muốn rút đơn ứng tuyển này không? Hành động này không thể hoàn tác.')) return;

        if (hasAuth()) {
          if (!isNaN(Number(id))) {
            const originalText = btn.textContent;
            try {
              btn.disabled = true;
              btn.textContent = 'Đang rút...';
              await API.delete(`/candidate/applications/${id}`);
              const target = applications.find(a => String(a.id) === String(id));
              if (target) {
                target.status = 'withdrawn';
                target.statusText = 'Đã rút đơn';
              }
              setStorage(STORAGE_KEYS.APPLICATIONS, applications);
              renderApplicationsList();
              notify('Đã rút đơn ứng tuyển thành công. Đơn được lưu vào lịch sử.', 'warning');
            } catch (err) {
              console.warn('[API] Rút đơn thất bại:', err.message);
              notify('Lỗi rút đơn ứng tuyển: ' + (err.message || 'Không thể rút đơn trên máy chủ'), 'error');
              btn.disabled = false;
              btn.textContent = originalText;
            }
          } else {
            notify('Đơn ứng tuyển không hợp lệ trên máy chủ.', 'warning');
          }
          return;
        }

        // Chế độ ngoại tuyến (chưa đăng nhập) - cập nhật trạng thái withdrawn để lưu giữ lịch sử
        const target = applications.find(a => String(a.id) === String(id));
        if (target) {
          target.status = 'withdrawn';
          target.statusText = 'Đã rút đơn';
        }
        setStorage(STORAGE_KEYS.APPLICATIONS, applications);
        renderApplicationsList();
        notify('Đã rút đơn ứng tuyển thành công. Đơn được lưu vào lịch sử.', 'warning');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 12. VIỆC LÀM ĐÃ LƯU (SAVED JOBS)
  // --------------------------------------------------------------------------
  let savedJobsData = [];

  async function loadAndRenderSavedJobs() {
    const container = document.getElementById('savedJobsContainer');
    if (!container) return;

    if (hasAuth()) {
      try {
        const res = await API.get('/candidate/saved-jobs');
        if (res && Array.isArray(res.data)) {
          savedJobsData = res.data.map(item => ({
            id: item.job_id,
            title: item.title,
            slug: item.slug,
            company: item.company_name,
            logoUrl: item.logo_url,
            location: item.location_name,
            salary: (item.salary_min && item.salary_max)
              ? `${Math.round(item.salary_min / 1e6)} - ${Math.round(item.salary_max / 1e6)} Triệu`
              : 'Thỏa thuận',
            employmentType: item.employment_type === 'full_time' ? 'Toàn thời gian' : item.employment_type,
            deadline: item.deadline ? new Date(item.deadline).toLocaleDateString('vi-VN') : 'Hạn nộp mở'
          }));
          const bookmarkedIds = savedJobsData.map(j => j.id);
          setStorage(STORAGE_KEYS.BOOKMARKS, bookmarkedIds);
        }
      } catch (err) {
        console.warn('[API] Lỗi tải việc làm đã lưu:', err.message);
      }
    }

    renderSavedJobsList();
  }

  function renderSavedJobsList() {
    const container = document.getElementById('savedJobsContainer');
    if (!container) return;

    const bookmarkedIds = getStorage(STORAGE_KEYS.BOOKMARKS, []);
    const saveBadge = document.getElementById('sidebarSaveCount');
    if (saveBadge) saveBadge.textContent = savedJobsData.length || bookmarkedIds.length;

    if (savedJobsData.length === 0 && bookmarkedIds.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <i class="fa-regular fa-bookmark" aria-hidden="true"></i>
          <h3>Bạn chưa lưu tin tuyển dụng nào!</h3>
          <p>Khi tìm kiếm việc làm trên JobPortal, hãy bấm biểu tượng lưu tin để đánh dấu các công việc yêu thích và xem lại tại đây.</p>
          <a href="./jobs.html" class="btn-primary" style="text-decoration:none;">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span>Đi đến sàn việc làm</span>
          </a>
        </div>
      `;
      return;
    }

    const itemsToRender = savedJobsData.length > 0 ? savedJobsData : bookmarkedIds.map(id => ({
      id,
      title: `Vị trí việc làm (#${id})`,
      company: 'Doanh nghiệp IT',
      location: 'TP.HCM',
      salary: 'Thỏa thuận',
      deadline: 'Đang mở'
    }));

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${itemsToRender.map(job => `
          <div class="dashboard-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span class="candidate-badge" style="background:#ecfdf5; color:#065f46;">Đang mở tuyển</span>
                <button type="button" class="btn-remove-bookmark" data-id="${job.id}" style="background:none; border:none; color:var(--color-primary); cursor:pointer; font-size:1.1rem;" title="Bỏ lưu công việc này">
                  <i class="fa-solid fa-bookmark"></i>
                </button>
              </div>
              <h3 style="font-size: 1.05rem; font-weight:700; color:var(--color-dark); margin-bottom: 4px;">
                <a href="./job-detail.html?id=${job.id}" style="color:inherit; text-decoration:none;">${job.title}</a>
              </h3>
              <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 8px;"><i class="fa-regular fa-building"></i> ${job.company}</p>
              <div style="font-size: 0.85rem; color: var(--color-body); display: flex; gap: 10px; flex-wrap: wrap;">
                <span><i class="fa-solid fa-money-bill-wave"></i> ${job.salary}</span>
                <span><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--color-border-light); padding-top: 12px;">
              <a href="./job-detail.html?id=${job.id}" class="btn-primary btn-sm" style="flex:1; text-align:center; text-decoration:none; justify-content:center;">
                Ứng tuyển ngay
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.btn-remove-bookmark').forEach(btn => {
      btn.addEventListener('click', async function () {
        const id = this.getAttribute('data-id');
        if (hasAuth()) {
          if (!isNaN(Number(id))) {
            try {
              btn.disabled = true;
              await API.delete(`/candidate/saved-jobs/${id}`);
              savedJobsData = savedJobsData.filter(j => String(j.id) !== String(id));
              let currentBookmarks = getStorage(STORAGE_KEYS.BOOKMARKS, []);
              currentBookmarks = currentBookmarks.filter(item => String(item) !== String(id));
              setStorage(STORAGE_KEYS.BOOKMARKS, currentBookmarks);
              renderSavedJobsList();
              notify('Đã bỏ lưu tin việc làm này thành công.', 'info');
            } catch (err) {
              console.warn('[API] Lỗi bỏ lưu việc làm:', err.message);
              notify('Lỗi bỏ lưu việc làm: ' + (err.message || 'Không thể bỏ lưu việc làm'), 'error');
              btn.disabled = false;
            }
          } else {
            notify('Mã việc làm không hợp lệ trên máy chủ.', 'warning');
          }
          return;
        }

        // Chế độ ngoại tuyến (chưa đăng nhập)
        savedJobsData = savedJobsData.filter(j => String(j.id) !== String(id));
        let currentBookmarks = getStorage(STORAGE_KEYS.BOOKMARKS, []);
        currentBookmarks = currentBookmarks.filter(item => String(item) !== String(id));
        setStorage(STORAGE_KEYS.BOOKMARKS, currentBookmarks);
        renderSavedJobsList();
        notify('Đã bỏ lưu tin việc làm này.', 'info');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 13. ĐĂNG XUẤT
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
        }, 600);
      }
    });
  }

  // Mobile menu
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const candidateSidebar = document.querySelector('.candidate-sidebar');
  if (mobileMenuBtn && candidateSidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = candidateSidebar.style.display === 'flex';
      candidateSidebar.style.display = isOpen ? 'none' : 'flex';
      mobileMenuBtn.setAttribute('aria-expanded', !isOpen);
    });
  }

  // --------------------------------------------------------------------------
  // 14. KHỞI TẠO & ĐỒNG BỘ VỚI BACKEND API
  // --------------------------------------------------------------------------
  renderProfileHeader();
  renderEducations();
  renderSkills();
  renderResumes();
  renderLinks();
  updateProfileCompletion();

  // Tải dữ liệu thật từ Backend API nếu đã đăng nhập
  async function syncFromBackend() {
    if (!hasAuth()) return;

    try {
      // 1. Đồng bộ Profile
      const profileRes = await API.get('/candidate/profile');
      if (profileRes && profileRes.data) {
        const u = profileRes.data;
        profile.fullName = u.full_name || profile.fullName;
        profile.email = u.email || profile.email;
        profile.phone = u.phone || profile.phone;
        setStorage(STORAGE_KEYS.PROFILE, profile);
        renderProfileHeader();
      }

      // 2. Đồng bộ Kho CV
      const resumesRes = await API.get('/candidate/resumes');
      if (resumesRes && Array.isArray(resumesRes.data)) {
        resumes = resumesRes.data.map(item => ({
          id: item.resume_id,
          title: item.resume_title,
          fileName: item.resume_title,
          fileUrl: item.file_url,
          fileSize: 'PDF',
          uploadDate: new Date(item.created_at).toLocaleDateString('vi-VN'),
          isDefault: Boolean(item.is_default)
        }));
        setStorage(STORAGE_KEYS.RESUMES, resumes);
        renderResumes();
      }

      // 3. Đồng bộ Thống kê Dashboard
      const statsRes = await API.get('/candidate/stats');
      if (statsRes && statsRes.data) {
        const { totalApplications, totalSavedJobs } = statsRes.data;
        const appBadge = document.getElementById('sidebarAppCount');
        const saveBadge = document.getElementById('sidebarSaveCount');
        if (appBadge) appBadge.textContent = totalApplications;
        if (saveBadge) saveBadge.textContent = totalSavedJobs;
      }

      updateProfileCompletion();
    } catch (err) {
      console.warn('[CANDIDATE] Đồng bộ Backend API:', err.message);
    }
  }

  syncFromBackend();
});
