/* ==========================================================================
   PERSONAL PORTFOLIO JAVASCRIPT — TRAN HUU THANH (ID: 044206000003)
   Gồm 3 chức năng cơ bản, dễ giải thích khi vấn đáp:
   1. Hiệu ứng gõ chữ tự động (Typing Effect bằng setTimeout)
   2. Đổi giao diện Sáng / Tối (classList.toggle)
   3. Lọc thẻ Kỹ năng (querySelectorAll & forEach)
   ========================================================================== */

// --- CHỨC NĂNG 1: HIỆU ỨNG GÕ CHỮ TỰ ĐỘNG (TYPING ANIMATION) ---
const typingElement = document.getElementById('typingText');
const roleText = 'IT Student @ UTH • Fullstack & AI';
let charIndex = 0;

function typeWriter() {
  if (charIndex < roleText.length) {
    typingElement.textContent += roleText.charAt(charIndex);
    charIndex++;
    setTimeout(typeWriter, 65); // Gõ từng chữ cái mỗi 65ms
  }
}
typeWriter();

// --- CHỨC NĂNG 2: ĐỔI GIAO DIỆN SÁNG / TỐI ---
const themeBtn = document.getElementById('themeBtn');

themeBtn.addEventListener('click', function () {
  document.body.classList.toggle('light-mode');

  if (document.body.classList.contains('light-mode')) {
    themeBtn.textContent = '🌙 Theme';
  } else {
    themeBtn.textContent = '☀️ Theme';
  }
});

// --- CHỨC NĂNG 3: LỌC CÁC THẺ KỸ NĂNG THEO NHÓM ---
const filterButtons = document.querySelectorAll('.filter-btn');
const skillItems = document.querySelectorAll('.skill-item');

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    // Đổi nút đang active
    filterButtons.forEach(function (btn) {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    const selectedType = button.getAttribute('data-type');

    // Ẩn/hiện thẻ kỹ năng kèm hiệu ứng trượt mượt
    skillItems.forEach(function (item) {
      const itemType = item.getAttribute('data-type');

      if (selectedType === 'all' || itemType === selectedType) {
        item.style.display = 'block';
        item.style.animation = 'fadeUp 0.4s ease forwards';
      } else {
        item.style.display = 'none';
      }
    });
  });
});
