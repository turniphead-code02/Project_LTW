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
            const rawTarget = statEl.getAttribute('data-target') || '1000';
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

  // 4. LƯU VIỆC LÀM YÊU THÍCH (BOOKMARK BUTTON TOGGLE - EVENT DELEGATION)
  const jobsGrid = document.querySelector('.jobs-grid');
  if (jobsGrid) {
    jobsGrid.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn-bookmark');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();

      const isSaved = btn.classList.toggle('is-saved');
      const jobTitle = btn.closest('.job-card').querySelector('.job-card-title').textContent.trim();

      if (isSaved) {
        btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
        btn.setAttribute('aria-label', 'Bỏ lưu việc làm');
        if (window.showToast) {
          window.showToast(`Đã lưu "${jobTitle}" vào danh sách theo dõi!`, 'success');
        }
      } else {
        btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
        btn.setAttribute('aria-label', 'Lưu việc làm này');
        if (window.showToast) {
          window.showToast(`Đã bỏ lưu "${jobTitle}"!`, 'warning');
        }
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
    const title = (job.title || '').toLowerCase();
    if (slug.includes('thiet-ke') || title.includes('ui/ux') || title.includes('designer')) return 'design';
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

  async function loadHomeOverview() {
    if (!window.JobPortalAPI || typeof window.JobPortalAPI.get !== 'function') return;
    try {
      const res = await window.JobPortalAPI.get('/home/overview');
      if (!res || !res.success || !res.data) return;

      const { featuredJobs, topCompanies } = res.data;

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
                <button class="btn-bookmark" type="button" aria-label="Lưu công việc này"><i class="fa-regular fa-bookmark"></i></button>
              </div>
            </article>
          `;
        }).join('');
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
      }
    } catch (err) {
      // Giữ nguyên dữ liệu tĩnh nếu chưa kết nối được server (Zero Dead-End)
      console.warn('[Home] Dùng dữ liệu hiển thị dự phòng:', err.message);
    }
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

