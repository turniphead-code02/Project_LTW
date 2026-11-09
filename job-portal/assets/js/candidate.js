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
 *   1. Quản lý thông tin cá nhân (Họ tên, SĐT, Email, Địa điểm, Chức danh, Bio)
 *   2. Quản lý học vấn (Thêm, xóa, hiển thị danh sách trường học)
 *   3. Quản lý kỹ năng (Thêm, xóa thẻ kỹ năng, gợi ý tag nhanh)
 *   4. Quản lý kho CV (Upload file PDF <= 5MB, đặt CV mặc định, xóa CV)
 *   5. Quản lý liên kết cá nhân (Portfolio, GitHub)
 *   6. Tính toán % độ hoàn thiện hồ sơ động (Profile Completion Engine)
 *   7. Theo dõi vòng đời đơn ứng tuyển với Stepper 4 bước (Recruitment Timeline)
 *   8. Xem & quản lý việc làm đã lưu (Bookmarks Sync)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

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

  // Helper đọc LocalStorage an toàn
  function getStorage(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : fallback;
    } catch (e) {
      console.warn('Lỗi đọc LocalStorage:', key, e);
      return fallback;
    }
  }

  // Helper ghi LocalStorage
  function setStorage(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Lỗi ghi LocalStorage:', key, e);
    }
  }

  // Toast helper (dùng chung main.js hoặc fallback)
  function notify(msg, type = 'success') {
    if (window.showToast) {
      window.showToast(msg, type);
    } else {
      alert(msg);
    }
  }

  // --------------------------------------------------------------------------
  // 2. KHỞI TẠO DỮ LIỆU MẶC ĐỊNH CHO NGUYỄN PHÚ QUANG
  // --------------------------------------------------------------------------
  const session = getStorage(STORAGE_KEYS.SESSION, null);
  const initialName = (session && (session.fullName || session.name)) || 'Nguyễn Phú Quang';
  const initialEmail = (session && session.email) || 'quang.np@student.ut.edu.vn';

  // Dữ liệu Profile mặc định
  let profile = getStorage(STORAGE_KEYS.PROFILE, {
    fullName: initialName,
    email: initialEmail,
    phone: '0901 234 567',
    location: 'hcm',
    title: 'Frontend Web Developer (Fresher / Junior)',
    bio: 'Sinh viên CNTT trường ĐH Giao Thông Vận Tải TP.HCM (UTH). Đam mê lập trình Web hiện đại với HTML5, CSS3, JavaScript và React.'
  });

  // Dữ liệu Học vấn mặc định
  let educations = getStorage(STORAGE_KEYS.EDUCATION, [
    {
      id: 'edu-1',
      school: 'Trường ĐH Giao Thông Vận Tải TP.HCM (UTH)',
      major: 'Công Nghệ Thông Tin (Khoa CNTT)',
      startYear: '2022',
      endYear: '2026'
    }
  ]);

  // Dữ liệu Kỹ năng mặc định
  let skills = getStorage(STORAGE_KEYS.SKILLS, [
    'HTML5 Semantic', 'CSS3 Modern', 'JavaScript ES6+', 'ReactJS', 'Responsive Web Design', 'Git / GitHub', 'Figma', 'Bootstrap 5'
  ]);

  // Dữ liệu CV mặc định
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

  // Dữ liệu Liên kết cá nhân mặc định
  let links = getStorage(STORAGE_KEYS.LINKS, {
    portfolio: '../portfolios/NguyenPhuQuang/index.html',
    github: 'https://github.com/nguyenphuquang'
  });

  // Khởi tạo mẫu ứng tuyển nếu chưa có (để hiển thị Stepper 4 bước chuẩn mục 5.4 QTTK)
  let applications = getStorage(STORAGE_KEYS.APPLICATIONS, null);
  if (!applications || !Array.isArray(applications) || applications.length === 0) {
    applications = [
      {
        id: 'app-sample-1',
        jobId: 'job-02',
        jobTitle: 'Junior Backend Node.js / NestJS Engineer',
        company: 'FPT Software Global',
        salary: '14 - 20 Triệu',
        location: 'TP. Thủ Đức, TP.HCM',
        applicantName: profile.fullName,
        applicantEmail: profile.email,
        fileName: 'CV_NguyenPhuQuang_Backend.pdf',
        fileSize: '1.25 MB',
        appliedAt: '24/10/2026 08:30',
        status: 'interview', // submitted -> viewed -> interview -> offer
        statusText: 'Hẹn phỏng vấn',
        stepIndex: 3, // Bước 3/4
        feedback: 'Chúc mừng bạn! FPT Software mời bạn tham gia vòng phỏng vấn kỹ thuật online vào lúc 09:30 ngày 15/11/2026 qua Microsoft Teams. Link phòng họp đã gửi qua Email của bạn.'
      },
      {
        id: 'app-sample-2',
        jobId: 'job-01',
        jobTitle: 'Frontend React Developer (Junior / Middle)',
        company: 'Công Ty Cổ Phần Công Nghệ VNG',
        salary: '15 - 22 Triệu',
        location: 'Quận 7, TP.HCM',
        applicantName: profile.fullName,
        applicantEmail: profile.email,
        fileName: 'CV_NguyenPhuQuang_Frontend_2026.pdf',
        fileSize: '1.45 MB',
        appliedAt: '25/10/2026 14:15',
        status: 'viewed',
        statusText: 'Doanh nghiệp đã xem hồ sơ',
        stepIndex: 2, // Bước 2/4
        feedback: 'Bộ phận Tuyển dụng VNG đã mở xem CV của bạn lúc 10:20 ngày 26/10/2026 và đang tiến hành đánh giá chuyên môn.'
      }
    ];
    setStorage(STORAGE_KEYS.APPLICATIONS, applications);
  }

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

    // Form inputs
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
  // 4. TÍNH TOÁN ĐỘ HOÀN THIỆN HỒ SƠ (PROFILE COMPLETION ENGINE)
  // --------------------------------------------------------------------------
  function updateProfileCompletion() {
    let score = 0;

    // 1. Thông tin cá nhân (25%)
    if (profile.fullName && profile.phone && profile.location) {
      score += 25;
    } else if (profile.fullName) {
      score += 15;
    }

    // 2. Học vấn (20%)
    if (educations && educations.length > 0) {
      score += 20;
    }

    // 3. Kỹ năng (20%)
    if (skills && skills.length >= 3) {
      score += 20;
    } else if (skills && skills.length > 0) {
      score += 10;
    }

    // 4. Có CV tải lên (25%)
    if (resumes && resumes.length > 0) {
      score += 25;
    }

    // 5. Liên kết Portfolio hoặc GitHub (10%)
    if (links && (links.portfolio || links.github)) {
      score += 10;
    }

    // Giới hạn max 100%
    score = Math.min(score, 100);

    const completionPercent = document.getElementById('completionPercent');
    const progressFill = document.getElementById('progressFill');
    const progressTrack = document.getElementById('completionProgress');

    if (completionPercent) completionPercent.textContent = score + '%';
    if (progressFill) progressFill.style.width = score + '%';
    if (progressTrack) progressTrack.setAttribute('aria-valuenow', score);
  }

  // --------------------------------------------------------------------------
  // 5. XỬ LÝ CHỈNH SỬA & LƯU THÔNG TIN CÁ NHÂN
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
    profileForm.addEventListener('submit', function (e) {
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

      // Cập nhật session nếu có
      if (session) {
        session.fullName = fullName;
        session.name = fullName;
        setStorage(STORAGE_KEYS.SESSION, session);
      }

      renderProfileHeader();
      toggleProfileEdit(false);
      updateProfileCompletion();
      notify('Cập nhật thông tin cá nhân thành công!', 'success');
    });
  }

  // --------------------------------------------------------------------------
  // 6. XỬ LÝ HỌC VẤN (EDUCATION MANAGEMENT)
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
          <span class="education-years">📅 ${edu.startYear} — ${edu.endYear || 'Hiện tại'}</span>
        </div>
        <button type="button" class="btn-delete-item btn-delete-edu" data-id="${edu.id}" title="Xóa học vấn này" aria-label="Xóa học vấn">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `).join('');

    // Gắn sự kiện xóa
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

      const newEdu = {
        id: 'edu-' + Date.now(),
        school,
        major,
        startYear,
        endYear: endYear || 'Hiện tại'
      };

      educations.push(newEdu);
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
  // 7. XỬ LÝ KỸ NĂNG (SKILLS MANAGEMENT)
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

    // Sự kiện xóa tag kỹ năng
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

    // Kiểm tra trùng
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

  // Thêm gợi ý kỹ năng nhanh bên dưới form kỹ năng
  const skillsSection = document.getElementById('skillsSection');
  if (skillsSection) {
    const suggestedWrap = document.createElement('div');
    suggestedWrap.className = 'suggested-skills';
    suggestedWrap.innerHTML = `
      <p>💡 Gợi ý kỹ năng ngành IT:</p>
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
  // 8. XỬ LÝ KHO CV & UPLOAD CV MẶC ĐỊNH (RESUME MANAGEMENT)
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
              <span>📦 ${res.fileSize}</span> • <span>🕒 Tải lên: ${res.uploadDate}</span>
            </div>
          </div>
        </div>
        <div class="resume-actions-group">
          ${!res.isDefault ? `
            <button type="button" class="btn-outline btn-sm btn-set-default" data-id="${res.id}">
              Đặt làm mặc định
            </button>
          ` : ''}
          <button type="button" class="btn-outline btn-sm btn-download-cv" data-id="${res.id}" title="Tải CV về máy">
            <i class="fa-solid fa-download"></i>
          </button>
          <button type="button" class="btn-delete-item btn-delete-cv" data-id="${res.id}" title="Xóa CV này">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Đặt mặc định
    resumeList.querySelectorAll('.btn-set-default').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        resumes.forEach(r => { r.isDefault = (r.id === id); });
        setStorage(STORAGE_KEYS.RESUMES, resumes);
        renderResumes();
        notify('Đã cập nhật CV mặc định để nộp đơn tuyển dụng!', 'success');
      });
    });

    // Tải về mô phỏng
    resumeList.querySelectorAll('.btn-download-cv').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        const r = resumes.find(item => item.id === id);
        notify(`Đang tải xuống tệp: ${r ? r.title : 'CV.pdf'}...`, 'info');
      });
    });

    // Xóa CV
    resumeList.querySelectorAll('.btn-delete-cv').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn xóa tệp CV này khỏi kho hồ sơ?')) {
          resumes = resumes.filter(item => item.id !== id);
          // Nếu xóa mất CV mặc định, gán cho cái đầu tiên còn lại
          if (resumes.length > 0 && !resumes.some(r => r.isDefault)) {
            resumes[0].isDefault = true;
          }
          setStorage(STORAGE_KEYS.RESUMES, resumes);
          renderResumes();
          updateProfileCompletion();
          notify('Đã xóa CV khỏi kho hồ sơ.', 'warning');
        }
      });
    });
  }

  // Upload trigger
  if (uploadResumeBtn && resumeFileInput) {
    uploadResumeBtn.addEventListener('click', () => resumeFileInput.click());
  }

  // File selection validation
  if (resumeFileInput) {
    resumeFileInput.addEventListener('change', function () {
      if (this.files && this.files.length > 0) {
        handleResumeUpload(this.files[0]);
      }
    });
  }

  // Drag & drop upload
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
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleResumeUpload(e.dataTransfer.files[0]);
      }
    });
  }

  function handleResumeUpload(file) {
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      notify('Hệ thống chỉ chấp nhận tệp hồ sơ định dạng PDF chuẩn (.pdf)!', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      notify('Dung lượng tệp vượt quá 5MB. Vui lòng nén nhỏ lại trước khi tải lên!', 'error');
      return;
    }

    const sizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    if (resumeFileName) {
      resumeFileName.textContent = `Đã chọn: ${file.name} (${sizeMb})`;
    }

    // Tự động tạo bản ghi CV mới
    const newResume = {
      id: 'res-' + Date.now(),
      title: file.name,
      fileName: file.name,
      fileSize: sizeMb,
      uploadDate: new Date().toLocaleDateString('vi-VN'),
      isDefault: resumes.length === 0 // Nếu là cái đầu tiên thì tự làm default
    };

    resumes.unshift(newResume);
    setStorage(STORAGE_KEYS.RESUMES, resumes);
    renderResumes();
    updateProfileCompletion();
    notify(`Tải lên thành công: ${file.name}!`, 'success');
  }

  // --------------------------------------------------------------------------
  // 9. XỬ LÝ LIÊN KẾT CÁ NHÂN (PORTFOLIO & GITHUB)
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
  // 10. TÍCH HỢP TABS ĐIỀU HƯỚNG TRONG CANDIDATE DASHBOARD
  // Giải quyết triệt để lỗi 404 cho "my-applications.html" và "saved-jobs.html"
  // --------------------------------------------------------------------------
  const sidebarLinks = document.querySelectorAll('.sidebar-link[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  function switchTab(tabId) {
    // Cập nhật trạng thái active sidebar
    sidebarLinks.forEach(link => {
      const active = (link.getAttribute('data-tab') === tabId);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    // Cập nhật panel hiển thị
    tabPanels.forEach(panel => {
      const active = (panel.id === tabId);
      panel.classList.toggle('active', active);
    });

    // Đổi tiêu đề đầu trang
    const pageHeadingTitle = document.querySelector('.page-heading h1');
    const pageHeadingDesc = document.querySelector('.page-heading p');

    if (tabId === 'tab-profile') {
      if (pageHeadingTitle) pageHeadingTitle.textContent = 'Hồ sơ cá nhân & Kho CV';
      if (pageHeadingDesc) pageHeadingDesc.textContent = 'Quản lý thông tin hồ sơ, học vấn, kỹ năng, CV và các liên kết chuyên môn.';
    } else if (tabId === 'tab-applications') {
      if (pageHeadingTitle) pageHeadingTitle.textContent = 'Theo dõi đơn ứng tuyển';
      if (pageHeadingDesc) pageHeadingDesc.textContent = 'Trực quan hóa quy trình tuyển dụng 4 bước chuẩn mực theo đặc tả QTTK.html.';
      renderApplicationsList();
    } else if (tabId === 'tab-saved') {
      if (pageHeadingTitle) pageHeadingTitle.textContent = 'Việc làm đã lưu';
      if (pageHeadingDesc) pageHeadingDesc.textContent = 'Danh sách các cơ hội nghề nghiệp bạn đã đánh dấu quan tâm.';
      renderSavedJobsList();
    }

    // Cập nhật URL hash
    window.location.hash = tabId.replace('tab-', '');
  }

  sidebarLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetTab = this.getAttribute('data-tab');
      if (targetTab) switchTab(targetTab);
    });
  });

  // Hỗ trợ URL hash khi vào trang (vd: candidate-dashboard.html#applications)
  if (window.location.hash) {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'applications') switchTab('tab-applications');
    else if (hash === 'saved') switchTab('tab-saved');
    else switchTab('tab-profile');
  }

  // --------------------------------------------------------------------------
  // 11. RENDER TIẾN TRÌNH 4 BƯỚC TUYỂN DỤNG (RECRUITMENT 4-STEP STEPPER)
  // --------------------------------------------------------------------------
  function renderApplicationsList() {
    const container = document.getElementById('applicationsContainer');
    if (!container) return;

    applications = getStorage(STORAGE_KEYS.APPLICATIONS, []);

    // Cập nhật badge số lượng ở sidebar
    const appBadge = document.getElementById('sidebarAppCount');
    if (appBadge) appBadge.textContent = applications.length;

    if (applications.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
          <h3>Bạn chưa nộp đơn ứng tuyển nào!</h3>
          <p>Hãy khám phá ngay hơn 5.000+ vị trí việc làm IT hấp dẫn và nộp hồ sơ để bắt đầu hành trình nghề nghiệp.</p>
          <a href="./jobs.html" class="btn-primary" style="text-decoration:none;">
            <span>🔍 Khám phá việc làm ngay</span>
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = applications.map(app => {
      const step = app.stepIndex || 1; // 1: Submitted, 2: Viewed, 3: Interview, 4: Offer/Rejected

      return `
        <article class="dashboard-card" style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
            <div>
              <h2 style="font-size: 1.15rem; font-weight: 700; color: var(--color-dark); margin-bottom: 4px;">
                <a href="./job-detail.html?id=${app.jobId}" style="color: inherit; text-decoration: none;">${app.jobTitle}</a>
              </h2>
              <div style="font-size: 0.875rem; color: var(--color-muted); display: flex; gap: 12px; flex-wrap: wrap;">
                <span>🏢 <strong>${app.company}</strong></span>
                <span>💰 ${app.salary || 'Thương lượng'}</span>
                <span>📍 ${app.location || 'TP.HCM'}</span>
              </div>
            </div>
            <div>
              <span class="candidate-badge" style="background:#eff6ff; color:#1e40af;">
                ${app.statusText || 'Đã nộp đơn'}
              </span>
            </div>
          </div>

          <div style="background: var(--color-bg-page); border: 1px solid var(--color-border); border-radius: 8px; padding: 10px 14px; margin: 14px 0; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <span>📄 CV đã nộp: <strong>${app.fileName || 'CV_UngVien.pdf'}</strong> (${app.fileSize || '1.2 MB'})</span>
            <span style="color: var(--color-muted);">🕒 Nộp lúc: ${app.appliedAt}</span>
          </div>

          <!-- THANH TIẾN TRÌNH 4 BƯỚC (STEPPER TIMELINE THEO WIREFRAME 5.4 QTTK) -->
          <div class="stepper-timeline-box">
            <div class="stepper-track">
              <!-- BƯỚC 1 -->
              <div class="step-node ${step >= 1 ? 'completed' : 'pending'}">
                <div class="step-icon-bubble">${step >= 1 ? '✓' : '1'}</div>
                <div class="step-label-title">1. ĐÃ NỘP ĐƠN</div>
                <div class="step-label-desc">${app.appliedAt.slice(0, 10)}</div>
              </div>

              <div class="step-line ${step >= 2 ? 'completed' : ''}"></div>

              <!-- BƯỚC 2 -->
              <div class="step-node ${step >= 2 ? (step === 2 ? 'active' : 'completed') : 'pending'}">
                <div class="step-icon-bubble">${step > 2 ? '✓' : '2'}</div>
                <div class="step-label-title">2. ĐÃ XEM CV</div>
                <div class="step-label-desc">${step >= 2 ? 'Nhà tuyển dụng' : 'Đang chờ'}</div>
              </div>

              <div class="step-line ${step >= 3 ? 'completed' : ''}"></div>

              <!-- BƯỚC 3 -->
              <div class="step-node ${step >= 3 ? (step === 3 ? 'active' : 'completed') : 'pending'}">
                <div class="step-icon-bubble">${step > 3 ? '✓' : '3'}</div>
                <div class="step-label-title">3. PHỎNG VẤN</div>
                <div class="step-label-desc">${step >= 3 ? 'Đã xếp lịch' : 'Chưa xếp'}</div>
              </div>

              <div class="step-line ${step >= 4 ? 'completed' : ''}"></div>

              <!-- BƯỚC 4 -->
              <div class="step-node ${step >= 4 ? 'completed' : 'pending'}">
                <div class="step-icon-bubble">${step >= 4 ? '✓' : '4'}</div>
                <div class="step-label-title">4. KẾT QUẢ</div>
                <div class="step-label-desc">${step >= 4 ? 'Hoàn tất' : 'Đang duyệt'}</div>
              </div>
            </div>
          </div>

          ${app.feedback ? `
            <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid var(--color-warning); padding: 12px 14px; border-radius: 6px; font-size: 0.85rem; color: #92400e; margin-bottom: 14px;">
              <strong>💬 Phản hồi từ Nhà Tuyển Dụng:</strong> ${app.feedback}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--color-border-light); padding-top: 12px;">
            <a href="./job-detail.html?id=${app.jobId}" class="btn-outline btn-sm" style="text-decoration:none;">
              Xem lại tin tuyển dụng
            </a>
            <button type="button" class="btn-delete-item btn-withdraw-app" data-id="${app.id}" style="color:var(--color-danger); border:1px solid #fee2e2; padding:4px 10px; border-radius:6px; font-size:0.8rem; cursor:pointer;">
              Rút đơn ứng tuyển
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Sự kiện rút đơn
    container.querySelectorAll('.btn-withdraw-app').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        if (confirm('Bạn có chắc chắn muốn rút đơn ứng tuyển này không? Hành động này không thể hoàn tác.')) {
          applications = applications.filter(a => a.id !== id);
          setStorage(STORAGE_KEYS.APPLICATIONS, applications);
          renderApplicationsList();
          notify('Đã rút đơn ứng tuyển thành công.', 'warning');
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 12. RENDER VIỆC LÀM ĐÃ LƯU (SAVED JOBS / BOOKMARKS)
  // --------------------------------------------------------------------------
  function renderSavedJobsList() {
    const container = document.getElementById('savedJobsContainer');
    if (!container) return;

    const bookmarkedIds = getStorage(STORAGE_KEYS.BOOKMARKS, []);

    // Cập nhật badge số lượng ở sidebar
    const saveBadge = document.getElementById('sidebarSaveCount');
    if (saveBadge) saveBadge.textContent = bookmarkedIds.length;

    if (bookmarkedIds.length === 0) {
      container.innerHTML = `
        <div class="empty-state-box">
          <i class="fa-regular fa-heart" aria-hidden="true"></i>
          <h3>Bạn chưa lưu tin tuyển dụng nào!</h3>
          <p>Khi tìm kiếm việc làm trên JobPortal, hãy bấm biểu tượng trái tim để lưu lại các công việc yêu thích và xem lại tại đây.</p>
          <a href="./jobs.html" class="btn-primary" style="text-decoration:none;">
            <span>🔍 Đi đến sàn việc làm</span>
          </a>
        </div>
      `;
      return;
    }

    // Hiển thị danh sách thẻ việc làm đã lưu
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
        ${bookmarkedIds.map(id => `
          <div class="dashboard-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span class="candidate-badge" style="background:#ecfdf5; color:#065f46;">Đang mở tuyển</span>
                <button type="button" class="btn-remove-bookmark" data-id="${id}" style="background:none; border:none; color:var(--color-danger); cursor:pointer; font-size:1.1rem;" title="Bỏ lưu công việc này">
                  ❤️
                </button>
              </div>
              <h3 style="font-size: 1.05rem; font-weight:700; color:var(--color-dark); margin-bottom: 4px;">
                <a href="./job-detail.html?id=${id}" style="color:inherit; text-decoration:none;">Vị trí việc làm (#${id})</a>
              </h3>
              <p style="font-size: 0.85rem; color: var(--color-muted); margin-bottom: 12px;">Đã lưu vào danh bạ việc làm yêu thích của bạn.</p>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px; border-top: 1px solid var(--color-border-light); padding-top: 12px;">
              <a href="./job-detail.html?id=${id}" class="btn-primary btn-sm" style="flex:1; text-align:center; text-decoration:none; justify-content:center;">
                Ứng tuyển ngay
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Sự kiện bỏ lưu
    container.querySelectorAll('.btn-remove-bookmark').forEach(btn => {
      btn.addEventListener('click', function () {
        const id = this.getAttribute('data-id');
        let currentBookmarks = getStorage(STORAGE_KEYS.BOOKMARKS, []);
        currentBookmarks = currentBookmarks.filter(item => item !== id);
        setStorage(STORAGE_KEYS.BOOKMARKS, currentBookmarks);
        renderSavedJobsList();
        notify('Đã bỏ lưu tin việc làm này.', 'info');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 13. ĐĂNG XUẤT (LOGOUT ACTION)
  // --------------------------------------------------------------------------
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi JobPortal?')) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        notify('Đã đăng xuất thành công!', 'info');
        setTimeout(() => {
          window.location.href = './index.html';
        }, 600);
      }
    });
  }

  // Menu mobile toggle
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
  // 14. KHỞI TẠO TOÀN DIỆN (INITIALIZE RUN)
  // --------------------------------------------------------------------------
  renderProfileHeader();
  renderEducations();
  renderSkills();
  renderResumes();
  renderLinks();
  updateProfileCompletion();

  // Cập nhật số lượng ban đầu ở sidebar
  const initialApps = getStorage(STORAGE_KEYS.APPLICATIONS, []);
  const initialSaves = getStorage(STORAGE_KEYS.BOOKMARKS, []);
  const appBadge = document.getElementById('sidebarAppCount');
  const saveBadge = document.getElementById('sidebarSaveCount');
  if (appBadge) appBadge.textContent = initialApps.length;
  if (saveBadge) saveBadge.textContent = initialSaves.length;
});
