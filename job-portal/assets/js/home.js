/* ==========================================================================
   HOMEPAGE INTERACTIVE JAVASCRIPT (TRANG CHỦ JOB PORTAL)
   Tác giả: Trần Hữu Thành (Lead & Technical Architect — Nhóm 6 UTH)
   Mục đích: Bộ đếm số liệu, Tìm kiếm nhanh, Lọc tabs & Lưu việc làm
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // 1. HIỆU ỨNG BỘ ĐẾM SỐ THỐNG KÊ (ANIMATED STATS COUNTER)
  const statNumbers = document.querySelectorAll('.stat-number');
  let hasAnimatedStats = false;

  function animateCount(element, target, duration = 1500) {
    const startTime = performance.now();
    const isPlus = element.textContent.includes('+');

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Sử dụng easeOutQuart để số chạy chậm dần về cuối
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentVal = Math.floor(easeProgress * target);

      element.textContent = currentVal.toLocaleString('vi-VN') + (isPlus ? '+' : '');

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        element.textContent = target.toLocaleString('vi-VN') + (isPlus ? '+' : '');
      }
    }

    requestAnimationFrame(updateCounter);
  }

  // Sử dụng IntersectionObserver để kích hoạt khi người dùng cuộn tới
  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimatedStats) {
          hasAnimatedStats = true;
          statNumbers.forEach((statEl) => {
            const rawTarget = statEl.getAttribute('data-target') || '0';
            const targetVal = parseInt(rawTarget.replace(/\D/g, ''), 10);
            animateCount(statEl, targetVal);
          });
        }
      });
    }, { threshold: 0.3 });

    const statsSection = document.querySelector('.stats-section-wrap');
    if (statsSection) {
      statsObserver.observe(statsSection);
    }
  }

  // 2. XỬ LÝ BIỂU MẪU TÌM KIẾM NHANH (HERO SEARCH FORM)
  const searchForm = document.getElementById('homeSearchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const keyword = document.getElementById('searchKeyword').value.trim();
      const location = document.getElementById('searchLocation').value;
      const category = document.getElementById('searchCategory').value;

      if (!keyword && !location && !category) {
        if (window.showToast) {
          window.showToast('Vui lòng nhập từ khóa hoặc chọn tiêu chí tìm kiếm!', 'warning');
        }
        return;
      }

      // Xây dựng chuỗi query tham số chuyển hướng sang trang jobs.html (Module 1)
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (location) params.append('location', location);
      if (category) params.append('category', category);

      if (window.showToast) {
        window.showToast(`Đang tìm kiếm: ${keyword || 'Tất cả'}...`, 'success');
      }

      setTimeout(() => {
        // Chuyển hướng sang trang tra cứu
        window.location.href = `./jobs.html?${params.toString()}`;
      }, 600);
    });

    // 2.1. PHÍM TẮT "/" ĐỂ FOCUS NHANH VÀO Ô TÌM KIẾM
    const searchInput = document.getElementById('searchKeyword');
    if (searchInput) {
      document.addEventListener('keydown', function (e) {
        const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
        if (e.key === '/' && activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
          e.preventDefault();
          searchInput.focus();
          searchInput.select();
        }
      });
    }
  }

  // 3. CHUYỂN TAB VIỆC LÀM TRÊN TRANG CHỦ (JOBS FILTER TABS)
  const tabButtons = document.querySelectorAll('.jobs-filter-tabs .tab-btn');

  tabButtons.forEach((tabBtn) => {
    tabBtn.addEventListener('click', function () {
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabBtn.classList.add('active');

      const filterType = tabBtn.getAttribute('data-filter');
      const jobCards = document.querySelectorAll('.jobs-grid .job-card');

      jobCards.forEach((card) => {
        const cardCategory = card.getAttribute('data-category');
        if (filterType === 'all' || cardCategory === filterType) {
          card.style.display = 'flex';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. LƯU VIỆC LÀM YÊU THÍCH (BOOKMARK BUTTON TOGGLE - EVENT DELEGATION + API MYSQL)
  function getLoggedInRole() {
    try {
      const api = window.JobPortalAPI;
      if (!api || typeof api.getToken !== 'function' || !api.getToken()) return 'guest';
      const raw = localStorage.getItem('jobportal_session');
      const s = raw ? JSON.parse(raw) : null;
      return (s && s.role) ? String(s.role).toLowerCase() : 'candidate';
    } catch (_) {
      return 'guest';
    }
  }

  function isCandidateAuth() {
    return getLoggedInRole() === 'candidate';
  }

  // Ẩn nút Lưu việc làm nếu đang đăng nhập vai trò Employer hoặc Admin
  function hideBookmarkForNonCandidates() {
    const role = getLoggedInRole();
    if (role === 'employer' || role === 'admin') {
      document.querySelectorAll('.jobs-grid .btn-bookmark').forEach((b) => {
        b.style.display = 'none';
      });
    }
  }
  hideBookmarkForNonCandidates();

  const jobsGrid = document.querySelector('.jobs-grid');
  if (jobsGrid) {
    jobsGrid.addEventListener('click', async function (e) {
      const btn = e.target.closest('.btn-bookmark');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const jobCard = btn.closest('.job-card');
      const jobTitle = jobCard.querySelector('.job-card-title').textContent.trim();
      const jobId = btn.getAttribute('data-job-id');
      const isSaved = btn.classList.toggle('is-saved');

      if (isSaved) {
        btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        btn.setAttribute('aria-label', 'Bỏ lưu việc làm');
      } else {
        btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        btn.setAttribute('aria-label', 'Lưu việc làm này');
      }

      if (jobId && isCandidateAuth()) {
        try {
          if (isSaved) {
            await window.JobPortalAPI.post(`/candidate/saved-jobs/${jobId}`, {});
          } else {
            await window.JobPortalAPI.delete(`/candidate/saved-jobs/${jobId}`);
          }
        } catch (err) {
          if (window.showToast) {
            window.showToast(err.message || 'Không thể đồng bộ lưu việc làm lên máy chủ.', 'warning');
          }
          return;
        }
      }

      if (window.showToast) {
        window.showToast(
          isSaved ? `Đã lưu "${jobTitle}" vào danh sách theo dõi!` : `Đã bỏ lưu "${jobTitle}"!`,
          isSaved ? 'success' : 'warning'
        );
      }
    });
  }

  // 6. TẢI DỮ LIỆU ĐỘNG TỪ API /api/v1/home/overview (MYSQL)
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatSalaryRange(min, max, currency) {
    if (!min && !max) return 'Thỏa thuận';
    const unit = currency === 'USD' ? 'USD' : 'Triệu';
    const div = currency === 'USD' ? 1 : 1000000;
    const fMin = min ? Math.round(Number(min) / div) : null;
    const fMax = max ? Math.round(Number(max) / div) : null;
    if (fMin && fMax) return `${fMin} - ${fMax} ${unit}`;
    if (fMin) return `Từ ${fMin} ${unit}`;
    return `Đến ${fMax} ${unit}`;
  }

  function mapWorkTypeLabel(type) {
    const map = {
      full_time: 'Toàn thời gian',
      part_time: 'Bán thời gian',
      internship: 'Thực tập',
      remote: 'Làm từ xa'
    };
    return map[type] || 'Toàn thời gian';
  }

  function mapFilterCategory(job) {
    if (job.employment_type === 'internship' || job.experience_level === 'intern') return 'intern';
    const slug = (job.category_slug || '').toLowerCase();
    if (['marketing-truyen-thong', 'kinh-doanh-ban-hang', 'thuong-mai-dien-tu'].includes(slug)) return 'business';
    if (['tai-chinh-ke-toan', 'nhan-su-hanh-chinh', 'logistics-chuoi-cung-ung'].includes(slug)) return 'ops';
    return 'it';
  }

  function formatDeadline(dateStr) {
    if (!dateStr) return 'Đang mở';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return 'Đang mở';
    return d.toLocaleDateString('vi-VN');
  }

  function getCompanyShort(name) {
    if (!name) return 'TECH';
    const words = name.replace(/Công Ty|Cổ Phần|TNHH|Tập Đoàn|Công Nghệ/gi, '').trim().split(/\s+/);
    const candidate = words[words.length - 1] || name.split(/\s+/)[0];
    return candidate.toUpperCase().slice(0, 7);
  }

  let liveJobsCache = [];

  async function loadHomeOverview() {
    if (!window.JobPortalAPI || typeof window.JobPortalAPI.get !== 'function') return;
    try {
      const res = await window.JobPortalAPI.get('/home/overview');
      if (!res || !res.success || !res.data) return;

      const { stats, categories, featuredJobs, topCompanies } = res.data;

      // Cập nhật dải chỉ số thực tế từ MySQL
      if (stats) {
        const openEl = document.getElementById('statOpenJobs');
        const compEl = document.getElementById('statCompanies');
        const salEl = document.getElementById('statAvgSalary');
        const candEl = document.getElementById('statCandidates');
        const allJobsBtnText = document.getElementById('allJobsCtaLabel');

        const openCount = Number(stats.openJobs) || 0;
        const compCount = Number(stats.companies) || 0;
        const candCount = Number(stats.candidates) || 0;

        if (openEl) {
          openEl.setAttribute('data-target', String(openCount));
          openEl.textContent = openCount.toLocaleString('vi-VN');
        }
        if (compEl) {
          compEl.setAttribute('data-target', String(compCount));
          compEl.textContent = compCount.toLocaleString('vi-VN');
        }
        if (salEl) {
          salEl.textContent = stats.avgSalaryMillions ? `${stats.avgSalaryMillions}M` : 'Thỏa thuận';
        }
        if (candEl) {
          candEl.setAttribute('data-target', String(candCount));
          candEl.textContent = candCount.toLocaleString('vi-VN');
        }
        if (allJobsBtnText) {
          allJobsBtnText.textContent = openCount > 0
            ? `Xem Tất Cả ${openCount} Việc Làm Đang Mở`
            : 'Xem Tất Cả Việc Làm';
        }
      }

      // Đồng bộ danh mục ngành nghề đa lĩnh vực từ MySQL vào Hero Select & Categories Grid
      const searchCategoryEl = document.getElementById('searchCategory');
      if (searchCategoryEl && Array.isArray(categories) && categories.length > 0) {
        const currentCat = searchCategoryEl.value;
        searchCategoryEl.innerHTML =
          '<option value="">Tất cả ngành nghề</option>' +
          categories
            .map((cat) => `<option value="${escapeHtml(cat.slug)}">${escapeHtml(cat.category_name)}</option>`)
            .join('');
        if (currentCat) searchCategoryEl.value = currentCat;
      }

      const categoriesGrid = document.querySelector('.categories-grid');
      if (categoriesGrid && Array.isArray(categories) && categories.length > 0) {
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
          'thuong-mai-dien-tu': 'fa-cart-shopping'
        };
        categoriesGrid.innerHTML = categories.map((cat) => {
          const icon = iconMap[cat.slug] || 'fa-briefcase';
          const count = Number(cat.open_jobs_count) || 0;
          const countLabel = count > 0 ? `${count} việc làm đang mở` : 'Đang cập nhật tin tuyển dụng';
          return `
            <a href="./jobs.html?category=${encodeURIComponent(cat.slug)}" class="category-card">
              <div class="category-icon-box" aria-hidden="true"><i class="fa-solid ${icon}"></i></div>
              <div>
                <h3 class="category-title">${escapeHtml(cat.category_name)}</h3>
                <p class="category-count">${countLabel}</p>
              </div>
            </a>
          `;
        }).join('');
      }

      if (Array.isArray(featuredJobs)) {
        liveJobsCache = featuredJobs;
        updateRadarMetrics();
      }

      let savedSet = new Set();
      if (isCandidateAuth()) {
        try {
          const savedRes = await window.JobPortalAPI.get('/candidate/saved-jobs');
          if (savedRes && savedRes.success && Array.isArray(savedRes.data)) {
            savedRes.data.forEach((item) => savedSet.add(String(item.job_id)));
          }
        } catch (_) {}
      }

      if (jobsGrid && Array.isArray(featuredJobs) && featuredJobs.length > 0) {
        jobsGrid.innerHTML = featuredJobs.map((job, idx) => {
          const code = `JP-${String(job.job_id || idx + 1).padStart(2, '0')}`;
          const catFilter = mapFilterCategory(job);
          const salaryText = formatSalaryRange(job.salary_min, job.salary_max, job.currency);
          const workLabel = mapWorkTypeLabel(job.employment_type);
          const skills = (job.skills || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 4);
          const tagsHtml = skills.length
            ? skills.map((s) => `<span class="badge badge-tech">${escapeHtml(s)}</span>`).join('')
            : `<span class="badge badge-tech">${escapeHtml(job.category_name || 'IT')}</span>`;
          const shortLogo = escapeHtml(getCompanyShort(job.company_name));

          return `
            <article class="job-card" data-category="${catFilter}">
              <div>
                <div class="job-card-top">
                  <div class="company-logo-box">
                    <span style="color:var(--color-primary);">${shortLogo}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span class="job-code-badge"><i class="fa-solid fa-hashtag"></i> ${code}</span>
                    ${catFilter === 'intern'
                      ? '<span class="badge" style="background:#dbeafe; color:#1e40af;"><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i> Sinh viên</span>'
                      : '<span class="badge badge-urgent"><i class="fa-solid fa-fire" aria-hidden="true"></i> Tuyển gấp</span>'}
                  </div>
                </div>
                <h3 class="job-card-title">
                  <a href="./job-detail.html?id=${job.job_id}">${escapeHtml(job.title)}</a>
                </h3>
                <p class="job-card-company">
                  <span><i class="fa-regular fa-building" aria-hidden="true"></i> ${escapeHtml(job.company_name)}</span>
                  <span class="badge badge-verified"><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Đã xác thực</span>
                </p>
                <div class="job-card-meta">
                  <span class="meta-salary"><i class="fa-solid fa-money-bill-wave" aria-hidden="true"></i> ${escapeHtml(salaryText)}</span>
                  <span class="meta-item"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${escapeHtml(job.location_name || 'TP. Hồ Chí Minh')}</span>
                  <span class="meta-item"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(workLabel)}</span>
                </div>
                <div class="job-card-tags">${tagsHtml}</div>
              </div>
              <div class="job-card-footer">
                <span>Hạn nộp: ${formatDeadline(job.deadline)}</span>
                <button class="btn-bookmark${savedSet.has(String(job.job_id)) ? ' is-saved' : ''}" data-job-id="${job.job_id}" type="button" aria-label="${savedSet.has(String(job.job_id)) ? 'Bỏ lưu việc làm' : 'Lưu công việc này'}"><i class="${savedSet.has(String(job.job_id)) ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i></button>
              </div>
            </article>
          `;
        }).join('');
        hideBookmarkForNonCandidates();
      }

      const employersGrid = document.querySelector('.employers-grid');
      if (employersGrid && Array.isArray(topCompanies) && topCompanies.length > 0) {
        const colors = ['#ea580c', '#1e40af', '#dc2626', '#db2777', '#0284c7', '#047857'];
        employersGrid.innerHTML = topCompanies.map((comp, idx) => {
          const shortLogo = escapeHtml(getCompanyShort(comp.company_name));
          const color = colors[idx % colors.length];
          return `
            <a href="./jobs.html?keyword=${encodeURIComponent(comp.company_name)}" class="employer-card">
              <div class="employer-logo-img" style="background:#ffffff; display:flex; align-items:center; justify-content:center; font-weight:800; color:${color}; border:1px solid #e2e8f0;">${shortLogo}</div>
              <h4 class="employer-name">${escapeHtml(comp.company_name)}</h4>
              <span class="employer-openings">${Number(comp.open_positions) || 0} vị trí đang mở</span>
            </a>
          `;
        }).join('');
        hideBookmarkForNonCandidates();
      }
    } catch (err) {
      // Giữ nguyên dữ liệu tĩnh nếu chưa kết nối được server (Zero Dead-End)
      console.warn('[Home] Dùng dữ liệu hiển thị dự phòng:', err.message);
    }
  }

  // 7. BĂNG TRUYỀN TÍN HIỆU TUYỂN DỤNG THỜI GIAN THỰC (LIVE SIGNAL TICKER)
  const signalTickerEl = document.getElementById('liveSignalTicker');
  if (signalTickerEl) {
    const signals = [
      '[LIVE] Hệ thống đồng bộ trực tiếp việc làm đa ngành: IT, Marketing, Tài chính - Kế toán, Kinh doanh & Logistics',
      '[LIVE] Tìm kiếm thông minh theo chuyên ngành, tỉnh/thành phố, kỹ năng chuyên môn và khung lương minh bạch',
      '[LIVE] Quy trình ứng tuyển minh bạch 4 bước: Đã nộp → Đã xem → Phỏng vấn → Kết quả',
      '[LIVE] Doanh nghiệp đa lĩnh vực đăng tin miễn phí với quy chuẩn kiểm duyệt pháp nhân rõ ràng'
    ];
    let signalIdx = 0;
    setInterval(() => {
      signalIdx = (signalIdx + 1) % signals.length;
      signalTickerEl.style.opacity = '0';
      setTimeout(() => {
        signalTickerEl.textContent = signals[signalIdx];
        signalTickerEl.style.opacity = '1';
      }, 220);
    }, 4500);
  }

  // 8. TRẠM ĐỊNH GIÁ LƯƠNG & KỸ NĂNG (IT SALARY & SKILL RADAR)
  const levelBtns = document.querySelectorAll('.radar-level-btn');
  const skillChips = document.querySelectorAll('#radarSkillGroup .radar-chip');
  const salaryDisplayEl = document.getElementById('radarSalaryDisplay');
  const jobCountEl = document.getElementById('radarJobCount');
  const gaugeFillEl = document.getElementById('radarGaugeFill');
  const percentileEl = document.getElementById('radarPercentileLabel');
  const syncDownBtn = document.getElementById('radarSyncDownBtn');

  function updateRadarMetrics() {
    const activeLevel = document.querySelector('.radar-level-btn.active');
    if (!activeLevel || !salaryDisplayEl) return;

    const baseMin = parseFloat(activeLevel.getAttribute('data-base-min')) || 12;
    const baseMax = parseFloat(activeLevel.getAttribute('data-base-max')) || 17;

    const activeSkills = [];
    let totalBonus = 0;
    skillChips.forEach((chip, idx) => {
      if (chip.classList.contains('active')) {
        activeSkills.push(chip.getAttribute('data-skill') || '');
        const b = parseFloat(chip.getAttribute('data-bonus')) || 1.5;
        // Giảm dần biên độ cộng thêm sau kỹ năng thứ 3 để khung lương sát thực tế thị trường
        const weight = activeSkills.length <= 3 ? 1 : 0.45;
        totalBonus += b * weight;
      }
    });

    const estMin = (baseMin + totalBonus * 0.85).toFixed(1);
    const estMax = (baseMax + totalBonus * 1.1).toFixed(1);
    salaryDisplayEl.innerHTML = `${estMin} - ${estMax} Triệu <small>/ tháng</small>`;

    // Thanh phân vị (tính trên thang tối đa 35M)
    const midPoint = (parseFloat(estMin) + parseFloat(estMax)) / 2;
    const pct = Math.min(96, Math.max(18, Math.round((midPoint / 35) * 100)));
    if (gaugeFillEl) gaugeFillEl.style.width = `${pct}%`;

    if (percentileEl) {
      if (pct >= 72) percentileEl.textContent = 'Top 10% khung lương cạnh tranh';
      else if (pct >= 52) percentileEl.textContent = 'Top 25% mức lương thị trường';
      else if (pct >= 35) percentileEl.textContent = 'Mức chuẩn thị trường lao động';
      else percentileEl.textContent = 'Mức khởi điểm thực tập';
    }

    // Tính số việc làm khớp dựa trên dữ liệu MySQL thực hoặc thẻ việc làm hiện có
    if (jobCountEl) {
      if (liveJobsCache.length > 0) {
        const matched = activeSkills.length > 0
          ? liveJobsCache.filter((job) => {
              const hay = `${job.title} ${job.skills || ''} ${job.category_name || ''}`.toLowerCase();
              return activeSkills.some((sk) => hay.includes(sk.toLowerCase().replace('ui/ux ', '')));
            })
          : liveJobsCache;
        jobCountEl.textContent = String(matched.length);
      } else {
        const domCards = Array.from(document.querySelectorAll('.jobs-grid .job-card'));
        const matchedDom = activeSkills.length > 0
          ? domCards.filter((c) => activeSkills.some((sk) => c.textContent.toLowerCase().includes(sk.toLowerCase())))
          : domCards;
        jobCountEl.textContent = String(matchedDom.length);
      }
    }
  }

  levelBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      levelBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      updateRadarMetrics();
    });
  });

  skillChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateRadarMetrics();
    });
  });

  if (syncDownBtn) {
    syncDownBtn.addEventListener('click', () => {
      const selectedSkills = Array.from(document.querySelectorAll('#radarSkillGroup .radar-chip.active'))
        .map((el) => el.getAttribute('data-skill'));
      const searchKw = document.getElementById('searchKeyword');
      if (searchKw && selectedSkills.length > 0) {
        searchKw.value = selectedSkills[0];
      }
      const featuredSec = document.getElementById('featuredJobs');
      if (featuredSec) {
        featuredSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (window.showToast) {
        const label = selectedSkills.length ? selectedSkills.join(', ') : 'Tất cả kỹ năng';
        window.showToast(`Đã đồng bộ bộ kỹ năng: ${label}`, 'success');
      }
    });
  }

  updateRadarMetrics();

  // 9. INSTANT COMMAND SEARCH PALETTE DROPDOWN
  const kwInput = document.getElementById('searchKeyword');
  const previewDropdown = document.getElementById('searchPreviewDropdown');
  const previewList = document.getElementById('searchPreviewList');

  function getSearchPool() {
    if (liveJobsCache.length > 0) {
      return liveJobsCache.map((j) => ({
        id: j.job_id,
        title: j.title,
        company: j.company_name,
        location: j.location_name,
        salary: formatSalaryRange(j.salary_min, j.salary_max, j.currency),
        skills: j.skills || ''
      }));
    }
    return Array.from(document.querySelectorAll('.jobs-grid .job-card')).map((card) => {
      const link = card.querySelector('.job-card-title a');
      const href = link ? link.getAttribute('href') : './jobs.html';
      const idMatch = href.match(/id=([^&]+)/);
      return {
        id: idMatch ? idMatch[1] : '',
        href,
        title: link ? link.textContent.trim() : '',
        company: (card.querySelector('.job-card-company span') || {}).textContent || '',
        location: 'TP. Hồ Chí Minh',
        salary: (card.querySelector('.meta-salary') || {}).textContent || 'Thỏa thuận',
        skills: Array.from(card.querySelectorAll('.badge-tech')).map((b) => b.textContent).join(', ')
      };
    });
  }

  function renderSearchPreview(query) {
    if (!previewDropdown || !previewList) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      previewDropdown.hidden = true;
      return;
    }

    const pool = getSearchPool();
    const matches = pool.filter((item) =>
      `${item.title} ${item.company} ${item.skills} ${item.location}`.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matches.length === 0) {
      previewList.innerHTML = `<div class="search-preview-item"><span class="search-preview-meta">Không có kết quả khớp trực tiếp với "<strong>${escapeHtml(query)}</strong>" — nhấn Enter để tìm toàn bộ sàn.</span></div>`;
    } else {
      previewList.innerHTML = matches.map((m) => {
        const url = m.href || `./job-detail.html?id=${m.id}`;
        return `
          <a href="${url}" class="search-preview-item">
            <div>
              <div class="search-preview-title">${escapeHtml(m.title)}</div>
              <div class="search-preview-meta">${escapeHtml(m.company)} &bull; ${escapeHtml(m.location)}</div>
            </div>
            <span class="search-preview-salary">${escapeHtml(m.salary)}</span>
          </a>
        `;
      }).join('');
    }
    previewDropdown.hidden = false;
  }

  if (kwInput && previewDropdown) {
    kwInput.addEventListener('input', (e) => renderSearchPreview(e.target.value));
    kwInput.addEventListener('focus', (e) => {
      if (e.target.value.trim()) renderSearchPreview(e.target.value);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') previewDropdown.hidden = true;
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.hero-search-wrapper')) {
        previewDropdown.hidden = true;
      }
    });
  }

  loadHomeOverview();

  // 5. ĐĂNG KÝ NHẬN BẢN TIN TUYỂN DỤNG (NEWSLETTER FORM)
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const emailInput = newsletterForm.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        if (window.showToast) {
          window.showToast('Đăng ký nhận bản tin việc làm thành công!', 'success');
        }
        emailInput.value = '';
      }
    });
  }

});

