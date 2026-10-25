/* ==========================================================================
   FILE JAVASCRIPT TRANG PORTFOLIO CÁ NHÂN (MSSV: 044206000003)
   Gồm 3 chức năng cơ bản phục vụ vấn đáp môn Lập Trình Web:
   1. Bật/Tắt giao diện Sáng - Tối (classList.toggle)
   2. Lọc thẻ Kỹ năng theo nhóm (querySelectorAll & forEach)
   3. Kiểm tra dữ liệu Form liên hệ (Form Validation)
   ========================================================================== */

// --- CHỨC NĂNG 1: ĐỔI GIAO DIỆN SÁNG / TỐI ---
const themeBtn = document.getElementById('themeBtn');

themeBtn.addEventListener('click', function () {
  // Thêm hoặc xóa class 'light-mode' trên thẻ <body>
  document.body.classList.toggle('light-mode');

  // Kiểm tra xem đang ở chế độ nào để đổi chữ trên nút
  if (document.body.classList.contains('light-mode')) {
    themeBtn.textContent = '🌙 Đổi nền';
  } else {
    themeBtn.textContent = '☀️ Đổi nền';
  }
});

// --- CHỨC NĂNG 2: LỌC CÁC THẺ KỸ NĂNG THEO NHÓM ---
const filterButtons = document.querySelectorAll('.filter-btn');
const skillItems = document.querySelectorAll('.skill-item');

filterButtons.forEach(function (button) {
  button.addEventListener('click', function () {
    // B1: Bỏ class 'active' ở tất cả nút, sau đó gắn 'active' cho nút vừa bấm
    filterButtons.forEach(function (btn) {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    // B2: Lấy giá trị loại kỹ năng cần lọc từ thuộc tính data-type
    const selectedType = button.getAttribute('data-type');

    // B3: Duyệt qua từng thẻ kỹ năng để ẩn hoặc hiện
    skillItems.forEach(function (item) {
      const itemType = item.getAttribute('data-type');

      if (selectedType === 'all' || itemType === selectedType) {
        item.style.display = 'block'; // Hiện thẻ phù hợp
      } else {
        item.style.display = 'none';  // Ẩn thẻ không phù hợp
      }
    });
  });
});

// --- CHỨC NĂNG 3: KIỂM TRA DỮ LIỆU FORM LIÊN HỆ ---
const contactForm = document.getElementById('contactForm');
const formNotice = document.getElementById('formNotice');

contactForm.addEventListener('submit', function (event) {
  // Ngăn trang web tự động tải lại (reload) khi bấm nút Submit
  event.preventDefault();

  // Lấy giá trị người dùng nhập vào và cắt khoảng trắng thừa ở 2 đầu (.trim())
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  // Kiểm tra nếu còn ô trống thì báo lỗi màu đỏ
  if (fullName === '' || email === '' || message === '') {
    formNotice.style.color = '#f87171';
    formNotice.textContent = 'Vui lòng nhập đầy đủ Họ tên, Email và Lời nhắn!';
    return;
  }

  // Nếu hợp lệ thì hiện thông báo thành công màu vàng/xanh và xóa trắng form
  formNotice.style.color = '#4ade80';
  formNotice.textContent = 'Cảm ơn ' + fullName + '! Lời nhắn của bạn đã được gửi thành công.';
  contactForm.reset();
});
