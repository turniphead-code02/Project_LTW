/* ==========================================================================
   PORTFOLIO JAVASCRIPT — TRẦN HỮU THÀNH (MSSV: 044206000003)
   Toàn bộ tên biến, tên hàm và chú thích đều được viết bằng Tiếng Việt
   giúp bạn dễ đọc, dễ hiểu và tự tin trả lời vấn đáp / phản biện trước thầy cô.

   Gồm 4 chức năng chính:
   1. Hiệu ứng gõ chữ tự động (Typewriter Effect)
   2. Nút chuyển đổi giao diện Sáng / Tối (Dark / Light Mode)
   3. Bộ lọc chuyên môn / kỹ năng theo từng mảng (Filter)
   4. Tự động đánh dấu mục lục khi cuộn trang (Scroll-Spy)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // =========================================================================
  // CHỨC NĂNG 1: HIỆU ỨNG GÕ CHỮ TỰ ĐỘNG (TYPEWRITER EFFECT)
  // Giải thích: Lấy từng chữ cái trong chuỗi để ghép vào thẻ HTML theo nhịp thời gian
  // =========================================================================

  // Phần tử HTML nơi chữ sẽ hiển thị
  const phanTuHienThiChu = document.getElementById('typingText');

  // Danh sách các vai trò / định hướng chuyên môn xoay vòng
  const danhSachChuyenMon = [
    'Relational Schema & Database Architecture',
    'Fullstack Web Interfaces & Semantic UI',
    'Information Technology Scholar @ UTH',
    'Applied AI & Systems Engineering'
  ];

  let chiSoCau = 0;              // Chỉ số của câu hiện tại trong mảng (bắt đầu từ câu 0)
  let chiSoKyTu = 0;             // Vị trí ký tự đang gõ (0, 1, 2, ...)
  let dangXoaChu = false;         // Trạng thái: false = đang gõ tới, true = đang xoá lùi

  const tocDoGo = 50;            // Thời gian chờ giữa mỗi chữ khi gõ (50 mili-giây)
  const tocDoXoa = 28;           // Thời gian chờ giữa mỗi chữ khi xoá (28 mili-giây)
  const thoiGianDungXem = 2200;  // Thời gian dừng lại để người xem đọc xong câu (2.2 giây)

  function xuLyGoChuTuDong() {
    // Nếu không tìm thấy thẻ trên trang thì dừng hàm để tránh lỗi
    if (!phanTuHienThiChu) return;

    // Lấy câu chữ hiện tại từ danh sách
    const cauHienTai = danhSachChuyenMon[chiSoCau];

    if (dangXoaChu) {
      // Đang xoá: cắt bớt 1 ký tự ở cuối
      phanTuHienThiChu.textContent = cauHienTai.substring(0, chiSoKyTu - 1);
      chiSoKyTu--;
    } else {
      // Đang gõ: cộng thêm 1 ký tự tiếp theo
      phanTuHienThiChu.textContent = cauHienTai.substring(0, chiSoKyTu + 1);
      chiSoKyTu++;
    }

    // Xác định tốc độ cho lần gọi kế tiếp
    let tocDoTiepTheo = dangXoaChu ? tocDoXoa : tocDoGo;

    // Khi đã gõ hết câu: tạm dừng một lúc rồi chuyển sang trạng thái xoá
    if (!dangXoaChu && chiSoKyTu === cauHienTai.length) {
      tocDoTiepTheo = thoiGianDungXem;
      dangXoaChu = true;
    }
    // Khi đã xoá hết chữ: chuyển sang câu tiếp theo và bắt đầu gõ lại
    else if (dangXoaChu && chiSoKyTu === 0) {
      dangXoaChu = false;
      chiSoCau = (chiSoCau + 1) % danhSachChuyenMon.length; // Quay vòng lại từ đầu nếu hết danh sách
      tocDoTiepTheo = 350; // Chờ 0.35s trước khi gõ câu mới
    }

    // Gọi lại chính hàm này sau khoảng thời gian tocDoTiepTheo (đệ quy có kiểm soát)
    setTimeout(xuLyGoChuTuDong, tocDoTiepTheo);
  }

  // Khởi động hiệu ứng gõ chữ
  xuLyGoChuTuDong();


  // =========================================================================
  // CHỨC NĂNG 2: CHUYỂN ĐỔI GIAO DIỆN SÁNG / TỐI (DARK / LIGHT MODE)
  // Giải thích: Bật/tắt class 'light-mode' ở thẻ body và lưu vào bộ nhớ trình duyệt
  // =========================================================================

  const nutDoiGiaoDien = document.getElementById('themeBtn');

  // Kiểm tra xem trước đó người dùng đã chọn giao diện nào (lưu trong localStorage)
  const giaoDienDaLuu = localStorage.getItem('tht_giao_dien');
  if (giaoDienDaLuu === 'light') {
    document.body.classList.add('light-mode');
  }

  // Lắng nghe sự kiện click vào nút đổi giao diện
  if (nutDoiGiaoDien) {
    nutDoiGiaoDien.addEventListener('click', function () {
      // Bật hoặc tắt class 'light-mode' trên thẻ <body>
      document.body.classList.toggle('light-mode');

      // Kiểm tra trạng thái hiện tại để lưu lại vào localStorage
      const laGiaoDienSang = document.body.classList.contains('light-mode');
      localStorage.setItem('tht_giao_dien', laGiaoDienSang ? 'light' : 'dark');
    });
  }


  // =========================================================================
  // CHỨC NĂNG 3: BỘ LỌC KỸ NĂNG / CHUYÊN MÔN THEO MẢNG (FILTER)
  // Giải thích: Ẩn/hiện các thẻ kỹ năng dựa trên thuộc tính data-type khi bấm nút
  // =========================================================================

  const danhSachNutLoc = document.querySelectorAll('.ribbon-btn');
  const danhSachTheKyNang = document.querySelectorAll('.taxonomy-card');

  danhSachNutLoc.forEach(function (nutLoc) {
    nutLoc.addEventListener('click', function () {
      // 1. Xoá trạng thái active ở tất cả các nút
      danhSachNutLoc.forEach(function (nut) {
        nut.classList.remove('active');
      });

      // 2. Thêm class active cho nút vừa được bấm
      nutLoc.classList.add('active');

      // 3. Lấy mảng chuyên môn mà người dùng muốn lọc (all, database, web, discipline)
      const chuyenMucDuocChon = nutLoc.getAttribute('data-type');

      // 4. Duyệt qua từng thẻ kỹ năng để quyết định ẩn hay hiện
      danhSachTheKyNang.forEach(function (theKyNang) {
        const chuyenMucCuaThe = theKyNang.getAttribute('data-type');

        if (chuyenMucDuocChon === 'all' || chuyenMucCuaThe === chuyenMucDuocChon) {
          theKyNang.style.display = 'flex';
          theKyNang.style.opacity = '1';
          theKyNang.style.transform = 'translateY(0)';
        } else {
          theKyNang.style.display = 'none';
        }
      });
    });
  });


  // =========================================================================
  // CHỨC NĂNG 4: TỰ ĐỘNG SÁNG MỤC LỤC KHI CUỘN TRANG (SCROLL-SPY)
  // Giải thích: Theo dõi xem người dùng đang cuộn tới phần nào để làm sáng mục lục bên trái
  // =========================================================================

  const danhSachPhanNoiDung = document.querySelectorAll('.editorial-section');
  const danhSachLienKetMucLuc = document.querySelectorAll('.index-link');

  // Sử dụng IntersectionObserver (API trình duyệt hiện đại, mượt và tiết kiệm pin)
  if ('IntersectionObserver' in window && danhSachPhanNoiDung.length > 0) {
    const tuyChonQuanSat = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Vùng nhận diện khi phần nội dung tiến vào màn hình
      threshold: 0
    };

    const boQuanSatCuon = new IntersectionObserver(function (danhSachMucQuanSat) {
      danhSachMucQuanSat.forEach(function (muc) {
        if (muc.isIntersecting) {
          const maDinhDanhPhan = muc.target.getAttribute('id'); // Lấy id của section đang hiển thị

          // Duyệt qua các liên kết mục lục để gắn class 'active' cho đúng phần
          danhSachLienKetMucLuc.forEach(function (lienKet) {
            const duongDanLienKet = lienKet.getAttribute('href');

            if (duongDanLienKet === '#' + maDinhDanhPhan) {
              lienKet.classList.add('active');
            } else {
              lienKet.classList.remove('active');
            }
          });
        }
      });
    }, tuyChonQuanSat);

    // Kích hoạt quan sát cho từng phần nội dung
    danhSachPhanNoiDung.forEach(function (phan) {
      boQuanSatCuon.observe(phan);
    });
  }

});
