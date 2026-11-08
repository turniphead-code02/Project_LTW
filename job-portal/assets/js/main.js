/* ==========================================================================
   JOB PORTAL CORE JAVASCRIPT (SHARED UTILITIES & HEADER LOGIC)
   Tác giả: Trần Hữu Thành (Lead & Technical Architect — Nhóm 6 UTH)
   Mục đích: Cung cấp tính năng Header, Mobile Menu & Toast dùng chung
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // 1. HIỆU ỨNG ĐỔ BÓNG CHO HEADER KHI CUỘN TRANG (STICKY SHADOW)
  const siteHeader = document.querySelector('.site-header');

  function handleHeaderScroll() {
    if (!siteHeader) return;
    if (window.scrollY > 20) {
      siteHeader.classList.add('is-scrolled');
    } else {
      siteHeader.classList.remove('is-scrolled');
    }
  }

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll(); // Kiểm tra ngay khi tải trang

  // 2. ĐIỀU HƯỚNG MENU TRÊN THIẾT BỊ DI ĐỘNG (MOBILE DRAWER TOGGLE)
  const mobileToggleBtn = document.querySelector('.mobile-toggle-btn');
  const headerNav = document.querySelector('.header-nav');

  if (mobileToggleBtn && headerNav) {
    mobileToggleBtn.addEventListener('click', function () {
      const isExpanded = mobileToggleBtn.getAttribute('aria-expanded') === 'true';
      mobileToggleBtn.setAttribute('aria-expanded', !isExpanded);
      headerNav.classList.toggle('is-open');

      // Đổi biểu tượng icon
      if (!isExpanded) {
        mobileToggleBtn.innerHTML = '✕';
        mobileToggleBtn.setAttribute('aria-label', 'Đóng menu điều hướng');
      } else {
        mobileToggleBtn.innerHTML = '☰';
        mobileToggleBtn.setAttribute('aria-label', 'Mở menu điều hướng');
      }
    });
  }

});

/**
 * 3. HÀM HIỂN THỊ THÔNG BÁO TOAST TOÀN CỤC (GLOBAL TOAST NOTIFICATION)
 * Cho phép các thành viên trong nhóm gọi ở bất kỳ trang nào:
 * window.showToast('Nộp hồ sơ thành công!', 'success');
 */
window.showToast = function (message, type = 'success') {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = '✓';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `
    <span style="font-size: 1.1rem; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  // Tự động biến mất sau 3.5 giây
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
};

