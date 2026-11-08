/* ==========================================================================
   MODULE 4: EMPLOYER PORTAL & RECRUITMENT CONSOLE — JAVASCRIPT TỔNG HỢP
   Thành viên: ĐINH DUY DIỄN (MSSV: 051206000952)
   Phụ thuộc: main.js (window.showToast)

   MỤC LỤC:
     - Phần A: Sidebar, thông báo, KPI, bảng hồ sơ mới  (employer-dashboard.html)
     - Phần B: Form đăng tin tuyển dụng                  (post-job.html)
     - Phần C: Bảng quản lý ứng viên & modal xem CV      (candidate-management.html)
   Mỗi phần tự kiểm tra phần tử HTML của mình; trang nào không có thì bỏ qua.
   ========================================================================== */

/* ---------- PHẦN A: DASHBOARD (SIDEBAR, KPI, BẢNG HỒ SƠ MỚI) ---------- */
document.addEventListener('DOMContentLoaded', function () {

  var shell = document.getElementById('empShell');
  var sidebar = document.getElementById('empSidebar');
  var backdrop = document.getElementById('empBackdrop');
  var toggleBtn = document.getElementById('btnToggleSidebar');

  function isMobile() { return window.matchMedia('(max-width: 1024px)').matches; }

  // 1. SIDEBAR: luôn hiện trên desktop; trên mobile là Drawer trượt ra (nút ☰ chỉ hiện ở mobile)
  function closeDrawer() {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (shell && sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      backdrop.classList.toggle('is-visible', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
    });
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('resize', function () { if (!isMobile()) closeDrawer(); });
  }

  // 2. THÔNG BÁO TRÊN TOPBAR (bấm chuông để mở danh sách)
  var notifBtn = document.getElementById('btnNotif');
  var notifPanel = document.getElementById('notifPanel');
  var notifList = document.getElementById('notifList');
  var notifCount = document.getElementById('notifCount');

  // Dữ liệu mẫu — sau này thay bằng API thông báo
  var notifications = [
    { id: 'n1', icon: '📄', title: 'Hồ sơ mới', text: 'Nguyễn Minh Khoa vừa ứng tuyển vị trí Frontend Developer (React).', time: '10 phút trước', href: './candidate-management.html' },
    { id: 'n2', icon: '📄', title: 'Hồ sơ mới', text: 'Trần Thu Hà vừa ứng tuyển vị trí Backend Developer (Node.js).', time: '1 giờ trước', href: './candidate-management.html' },
    { id: 'n3', icon: '⏰', title: 'Tin sắp hết hạn', text: 'Tin "Backend Developer (Node.js)" hết hạn nộp vào 12/11/2026.', time: '3 giờ trước', href: './employer-dashboard.html' },
    { id: 'n4', icon: '✅', title: 'Tin đã được duyệt', text: 'Tin "Frontend Developer (React)" đã được quản trị viên duyệt.', time: 'Hôm qua', href: './employer-dashboard.html', read: true },
    { id: 'n5', icon: '📅', title: 'Lịch phỏng vấn', text: 'Lê Quốc Bảo đã xác nhận lịch phỏng vấn QA/Tester.', time: 'Hôm qua', href: './candidate-management.html', read: true }
  ];

  // Nhớ trạng thái đã đọc giữa các trang (an toàn khi trình duyệt chặn storage)
  var READ_KEY = 'emp_notif_read';
  function loadRead() { try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) { return []; } }
  function saveRead(ids) { try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch (e) {} }
  var readIds = loadRead();
  function isRead(n) { return n.read || readIds.indexOf(n.id) !== -1; }

  function escText(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderNotifs() {
    if (!notifList) return;
    var unread = notifications.filter(function (n) { return !isRead(n); }).length;
    notifCount.textContent = unread;
    notifCount.style.display = unread ? 'flex' : 'none';
    if (!notifications.length) {
      notifList.innerHTML = '<div class="notif-empty">Chưa có thông báo nào.</div>';
      return;
    }
    notifList.innerHTML = notifications.map(function (n) {
      var u = !isRead(n);
      return '<a href="' + n.href + '" class="notif-item' + (u ? ' is-unread' : '') + '" data-id="' + n.id + '">' +
        '<span class="notif-icon" aria-hidden="true">' + n.icon + '</span>' +
        '<span class="notif-body"><div class="notif-title">' + escText(n.title) + '</div>' +
        '<div class="notif-text">' + escText(n.text) + '</div>' +
        '<div class="notif-time">' + n.time + '</div></span>' +
        (u ? '<span class="notif-unread-dot" aria-label="Chưa đọc"></span>' : '') +
        '</a>';
    }).join('');
  }

  function setNotifOpen(open) {
    notifPanel.hidden = !open;
    notifBtn.setAttribute('aria-expanded', String(open));
  }

  if (notifBtn && notifPanel) {
    renderNotifs();

    notifBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setNotifOpen(notifPanel.hidden);
    });

    // Event delegation: bấm vào 1 thông báo -> đánh dấu đã đọc (rồi chuyển trang theo href)
    notifList.addEventListener('click', function (e) {
      var item = e.target.closest('.notif-item');
      if (!item) return;
      if (readIds.indexOf(item.dataset.id) === -1) readIds.push(item.dataset.id);
      saveRead(readIds);
    });

    document.getElementById('btnMarkAllRead').addEventListener('click', function () {
      readIds = notifications.map(function (n) { return n.id; });
      saveRead(readIds);
      renderNotifs();
    });

    // Đóng khi bấm ra ngoài hoặc nhấn Esc
    document.addEventListener('click', function (e) {
      if (!notifPanel.hidden && !notifPanel.contains(e.target)) setNotifOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !notifPanel.hidden) { setNotifOpen(false); notifBtn.focus(); }
    });
  }

  // 3. KPI: đếm số tăng dần (tôn trọng reduced-motion)
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (reduce) { el.textContent = target.toLocaleString('vi-VN'); return; }
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / 800, 1);
      el.textContent = Math.round(target * p).toLocaleString('vi-VN');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // 4. BẢNG HỒ SƠ MỚI NHẬN (dữ liệu mẫu — sau này thay bằng API)
  var STATUS = {
    new:       { text: 'Mới nhận',     cls: 'status-new' },
    interview: { text: 'Hẹn phỏng vấn', cls: 'status-interview' },
    approved:  { text: 'Đã duyệt',     cls: 'status-approved' },
    rejected:  { text: 'Từ chối',      cls: 'status-rejected' }
  };

  var applicants = [
    { id: 1, name: 'Nguyễn Minh Khoa', job: 'Frontend Developer (React)', date: '06/11/2026', status: 'new' },
    { id: 2, name: 'Trần Thu Hà',      job: 'Backend Developer (Node.js)', date: '06/11/2026', status: 'new' },
    { id: 3, name: 'Lê Quốc Bảo',      job: 'Thực tập sinh QA/Tester',     date: '05/11/2026', status: 'interview' },
    { id: 4, name: 'Phạm Ngọc Anh',    job: 'Frontend Developer (React)', date: '04/11/2026', status: 'new' }
  ];

  var tbody = document.getElementById('recentTableBody');
  var emptyBox = document.getElementById('recentEmpty');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function render() {
    if (!tbody) return;
    emptyBox.hidden = applicants.length > 0;
    tbody.innerHTML = applicants.map(function (a) {
      var st = STATUS[a.status];
      var actions = a.status === 'new'
        ? '<button type="button" class="btn btn-primary btn-sm" data-act="interview" data-id="' + a.id + '">Hẹn phỏng vấn</button>' +
          '<button type="button" class="btn btn-danger-outline btn-sm" data-act="rejected" data-id="' + a.id + '">Từ chối</button>'
        : '<a href="./candidate-management.html" class="btn btn-ghost btn-sm">Xem chi tiết</a>';
      return '<tr>' +
        '<td data-label="Ứng viên"><div class="cell-strong">' + esc(a.name) + '</div></td>' +
        '<td data-label="Vị trí">' + esc(a.job) + '</td>' +
        '<td data-label="Ngày nộp">' + a.date + '</td>' +
        '<td data-label="Trạng thái"><span class="status ' + st.cls + '">' + st.text + '</span></td>' +
        '<td data-label="Thao tác"><div class="row-actions">' + actions + '</div></td>' +
        '</tr>';
    }).join('');
  }

  // Đổi trạng thái bằng event delegation
  if (tbody) {
    tbody.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var item = applicants.find(function (a) { return a.id === Number(btn.dataset.id); });
      if (!item) return;
      item.status = btn.dataset.act;
      render();
      window.showToast(
        item.status === 'rejected' ? 'Đã từ chối hồ sơ của ' + item.name + '.' : 'Đã hẹn phỏng vấn ' + item.name + '.',
        item.status === 'rejected' ? 'warning' : 'success'
      );
    });
  }

  render();
});

/* ---------- PHẦN B: FORM ĐĂNG TIN TUYỂN DỤNG (post-job.html) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('postJobForm');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var negotiable = $('salaryNegotiable');
  var salaryMin = $('salaryMin');
  var salaryMax = $('salaryMax');
  var editor = $('jobDescription');
  var editorWrap = $('editorWrap');

  // Hạn nộp tối thiểu là ngày mai
  var tomorrow = new Date(Date.now() + 86400000);
  $('deadline').min = tomorrow.toISOString().slice(0, 10);

  // Checkbox "Lương thỏa thuận" khóa 2 ô lương
  negotiable.addEventListener('change', function () {
    [salaryMin, salaryMax].forEach(function (el) {
      el.disabled = negotiable.checked;
      if (negotiable.checked) { el.value = ''; setError(el, ''); }
    });
  });

  // Thanh công cụ soạn thảo
  document.querySelectorAll('.editor-btn').forEach(function (btn) {
    btn.addEventListener('mousedown', function (e) { e.preventDefault(); });
    btn.addEventListener('click', function () {
      editor.focus();
      document.execCommand(btn.dataset.cmd, false, null);
    });
  });

  function setError(el, msg) {
    var box = el.id === 'jobDescription' ? editorWrap : el;
    box.classList.toggle('is-invalid', !!msg);
    var err = document.querySelector('[data-error-for="' + el.id + '"]');
    if (err) err.textContent = msg;
  }

  function validate() {
    var ok = true;
    function fail(el, msg) { setError(el, msg); ok = false; }

    var title = $('jobTitle');
    if (title.value.trim().length < 5) fail(title, 'Chức danh cần ít nhất 5 ký tự.'); else setError(title, '');

    var cat = $('jobCategory');
    if (!cat.value) fail(cat, 'Vui lòng chọn ngành nghề.'); else setError(cat, '');

    if (!negotiable.checked) {
      var min = Number(salaryMin.value), max = Number(salaryMax.value);
      if (!salaryMin.value || !salaryMax.value) { fail(salaryMax, 'Nhập mức lương hoặc chọn "Lương thỏa thuận".'); }
      else if (min <= 0 || max < min) { fail(salaryMax, 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.'); }
      else setError(salaryMax, '');
    } else setError(salaryMax, '');

    var dl = $('deadline');
    if (!dl.value || new Date(dl.value) < new Date(dl.min)) fail(dl, 'Hạn nộp phải từ ngày mai trở đi.'); else setError(dl, '');

    if (editor.textContent.trim().length < 30) fail(editor, 'Mô tả cần ít nhất 30 ký tự.'); else setError(editor, '');

    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      window.showToast('Vui lòng kiểm tra lại các trường báo lỗi.', 'error');
      var bad = form.querySelector('.is-invalid');
      if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    // TODO: gửi dữ liệu lên API đăng tin (xem DacTaKyThuatJOB_PORTAL.md)
    window.showToast('Đã gửi tin tuyển dụng, đang chờ quản trị viên duyệt.', 'success');
    setTimeout(function () { window.location.href = './employer-dashboard.html'; }, 1500);
  });

  // Xóa lỗi khi người dùng sửa lại
  form.addEventListener('input', function (e) {
    if (e.target.id) setError(e.target, '');
  });
});

/* ---------- PHẦN C: QUẢN LÝ ỨNG VIÊN (candidate-management.html) ---------- */
document.addEventListener('DOMContentLoaded', function () {
  var tbody = document.getElementById('candTableBody');
  if (!tbody) return;

  var STATUS = {
    new:       { text: 'Mới nhận',      cls: 'status-new' },
    approved:  { text: 'Đã duyệt',      cls: 'status-approved' },
    interview: { text: 'Hẹn phỏng vấn', cls: 'status-interview' },
    rejected:  { text: 'Từ chối',       cls: 'status-rejected' }
  };

  // Dữ liệu mẫu — sau này thay bằng API
  var candidates = [
    { id: 1, name: 'Nguyễn Minh Khoa', job: 'Frontend Developer (React)', date: '06/11/2026', status: 'new', email: 'khoa.nm@student.ut.edu.vn', phone: '0912 345 678', cv: 'CV_MinhKhoa.pdf', letter: 'Em có 1 năm làm dự án React và muốn phát triển thêm về giao diện sản phẩm.' },
    { id: 2, name: 'Trần Thu Hà',      job: 'Backend Developer (Node.js)', date: '06/11/2026', status: 'new', email: 'ha.tt@gmail.com', phone: '0987 111 222', cv: 'CV_ThuHa.pdf', letter: 'Em từng xây dựng REST API với Express và PostgreSQL cho đồ án môn học.' },
    { id: 3, name: 'Lê Quốc Bảo',      job: 'Thực tập sinh QA/Tester',     date: '05/11/2026', status: 'interview', email: 'bao.lq@gmail.com', phone: '0903 555 666', cv: 'CV_QuocBao.pdf', letter: 'Em muốn thực tập để học quy trình kiểm thử phần mềm thực tế.' },
    { id: 4, name: 'Phạm Ngọc Anh',    job: 'Frontend Developer (React)', date: '04/11/2026', status: 'approved', email: 'anh.pn@gmail.com', phone: '0934 777 888', cv: 'CV_NgocAnh.pdf', letter: '' },
    { id: 5, name: 'Võ Thanh Tùng',    job: 'Backend Developer (Node.js)', date: '03/11/2026', status: 'rejected', email: 'tung.vt@gmail.com', phone: '0977 999 000', cv: 'CV_ThanhTung.pdf', letter: 'Em đang tìm cơ hội làm việc toàn thời gian.' },
    { id: 6, name: 'Đặng Mỹ Linh',     job: 'Thực tập sinh QA/Tester',     date: '02/11/2026', status: 'new', email: 'linh.dm@gmail.com', phone: '0911 222 333', cv: 'CV_MyLinh.pdf', letter: 'Em đã học ISTQB Foundation và muốn áp dụng vào dự án thực tế.' }
  ];

  var currentFilter = 'all';
  var keyword = '';
  var openId = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }

  function updateCounts() {
    document.querySelectorAll('.filter-tab').forEach(function (tab) {
      var f = tab.dataset.filter;
      var n = f === 'all' ? candidates.length : candidates.filter(function (c) { return c.status === f; }).length;
      tab.querySelector('.tab-count').textContent = n;
    });
  }

  function actionButtons(c) {
    var defs = [['approved', 'Duyệt', 'btn-accent'], ['interview', 'Hẹn PV', 'btn-primary'], ['rejected', 'Từ chối', 'btn-danger-outline']];
    return defs.filter(function (d) { return d[0] !== c.status; }).map(function (d) {
      return '<button type="button" class="btn ' + d[2] + ' btn-sm" data-act="' + d[0] + '" data-id="' + c.id + '">' + d[1] + '</button>';
    }).join('');
  }

  function render() {
    var list = candidates.filter(function (c) {
      return (currentFilter === 'all' || c.status === currentFilter) &&
             (!keyword || norm(c.name + ' ' + c.job).indexOf(norm(keyword)) !== -1);
    });
    document.getElementById('candEmpty').hidden = list.length > 0;
    tbody.innerHTML = list.map(function (c) {
      var st = STATUS[c.status];
      return '<tr>' +
        '<td data-label="Ứng viên"><div class="cell-strong">' + esc(c.name) + '</div><div class="cell-sub">' + esc(c.email) + '</div></td>' +
        '<td data-label="Vị trí">' + esc(c.job) + '</td>' +
        '<td data-label="Ngày nộp">' + c.date + '</td>' +
        '<td data-label="Trạng thái"><span class="status ' + st.cls + '">' + st.text + '</span></td>' +
        '<td data-label="Thao tác"><div class="row-actions">' +
          '<button type="button" class="btn btn-outline btn-sm" data-view="' + c.id + '">Xem CV</button>' + actionButtons(c) +
        '</div></td></tr>';
    }).join('');
    updateCounts();
  }

  function setStatus(id, status) {
    var c = candidates.find(function (x) { return x.id === id; });
    if (!c) return;
    c.status = status;
    render();
    var msg = { approved: 'Đã duyệt hồ sơ của ', interview: 'Đã hẹn phỏng vấn ', rejected: 'Đã từ chối hồ sơ của ' }[status];
    window.showToast(msg + c.name + '.', status === 'rejected' ? 'warning' : 'success');
  }

  // Modal xem nhanh CV
  var modal = document.getElementById('cvModal');
  var lastFocus = null;
  function openModal(id) {
    var c = candidates.find(function (x) { return x.id === id; });
    if (!c) return;
    openId = id;
    lastFocus = document.activeElement;
    var st = STATUS[c.status];
    document.getElementById('cvModalTitle').textContent = c.name;
    document.getElementById('cvModalBody').innerHTML =
      '<div class="info-row"><span>Vị trí</span><strong>' + esc(c.job) + '</strong></div>' +
      '<div class="info-row"><span>Email</span><strong>' + esc(c.email) + '</strong></div>' +
      '<div class="info-row"><span>Điện thoại</span><strong>' + esc(c.phone) + '</strong></div>' +
      '<div class="info-row"><span>Ngày nộp</span><strong>' + c.date + '</strong></div>' +
      '<div class="info-row"><span>Trạng thái</span><span class="status ' + st.cls + '">' + st.text + '</span></div>' +
      '<div class="cv-box"><span>📄 ' + esc(c.cv) + '</span><button type="button" class="btn btn-ghost btn-sm" id="btnDownloadCv">Tải về</button></div>' +
      '<div><div class="emp-label-text" style="margin-bottom:6px;">Thư giới thiệu</div><div class="letter-box">' + (c.letter ? esc(c.letter) : 'Ứng viên không gửi thư giới thiệu.') + '</div></div>';
    modal.classList.add('is-open');
    document.getElementById('btnCloseCv').focus();
  }
  function closeModal() {
    modal.classList.remove('is-open');
    openId = null;
    if (lastFocus) lastFocus.focus();
  }

  // Sự kiện
  tbody.addEventListener('click', function (e) {
    var act = e.target.closest('button[data-act]');
    var view = e.target.closest('button[data-view]');
    if (act) setStatus(Number(act.dataset.id), act.dataset.act);
    if (view) openModal(Number(view.dataset.view));
  });

  document.querySelectorAll('.filter-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      currentFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(function (t) {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-pressed', String(t === tab));
      });
      render();
    });
  });

  document.getElementById('candSearch').addEventListener('input', function (e) { keyword = e.target.value.trim(); render(); });

  document.getElementById('btnCloseCv').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

  modal.addEventListener('click', function (e) {
    if (e.target.id === 'btnDownloadCv') window.showToast('Chức năng tải CV sẽ nối với API lưu trữ tệp.', 'warning');
    var a = e.target.closest('[data-modal-act]');
    if (a && openId) { var id = openId; closeModal(); setStatus(id, a.dataset.modalAct); }
  });

  render();
});
