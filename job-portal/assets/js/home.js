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
  }

  // 3. CHUYỂN TAB VIỆC LÀM TRÊN TRANG CHỦ (JOBS FILTER TABS)
  const tabButtons = document.querySelectorAll('.jobs-filter-tabs .tab-btn');
  const jobCards = document.querySelectorAll('.jobs-grid .job-card');

  tabButtons.forEach((tabBtn) => {
    tabBtn.addEventListener('click', function () {
      tabButtons.forEach((btn) => btn.classList.remove('active'));
      tabBtn.classList.add('active');

      const filterType = tabBtn.getAttribute('data-filter');

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

  // 4. LƯU VIỆC LÀM YÊU THÍCH (BOOKMARK BUTTON TOGGLE)
  const bookmarkButtons = document.querySelectorAll('.btn-bookmark');
  bookmarkButtons.forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      const isSaved = btn.classList.toggle('is-saved');
      const jobTitle = btn.closest('.job-card').querySelector('.job-card-title').textContent.trim();

      if (isSaved) {
        btn.innerHTML = '❤️';
        btn.setAttribute('aria-label', 'Bỏ lưu việc làm');
        if (window.showToast) {
          window.showToast(`Đã lưu "${jobTitle}" vào danh sách theo dõi!`, 'success');
        }
      } else {
        btn.innerHTML = '🤍';
        btn.setAttribute('aria-label', 'Lưu việc làm này');
        if (window.showToast) {
          window.showToast(`Đã bỏ lưu "${jobTitle}"!`, 'warning');
        }
      }
    });
  });

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

