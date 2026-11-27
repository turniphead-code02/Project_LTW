/* ==========================================================================
   MODULE 4: EMPLOYER PORTAL & RECRUITMENT CONSOLE — JAVASCRIPT TỔNG HỢP
   Thành viên: ĐINH DUY DIỄN (MSSV: 051206000952)
   Phụ thuộc: main.js (window.showToast)

   MỤC LỤC:
     - Phần 0: Gọi API & tiện ích dùng chung (EmployerAPI)
     - Phần A: Sidebar, thông báo, KPI, bảng        (employer-dashboard.html)
     - Phần B: Form đăng tin tuyển dụng             (post-job.html)
     - Phần C: Bảng quản lý ứng viên & modal xem CV (candidate-management.html)

   API sử dụng (backend/src/routes/employer.routes.js):
     GET   /api/v1/employer/dashboard
     POST  /api/v1/employer/jobs
     PATCH /api/v1/employer/applications/:id/status
     GET   /api/v1/employer/meta   (danh mục ngành nghề, địa điểm)

   Cách chạy: mở qua server (http://localhost:5000/employer-dashboard.html).
   Nếu không gọi được API (ví dụ mở bằng Live Server) trang tự dùng dữ liệu mẫu
   và hiện cảnh báo, để vẫn xem được giao diện.
   ========================================================================== */

/* ---------- PHẦN 0: GỌI API & TIỆN ÍCH DÙNG CHUNG ---------- */
var EmployerAPI = (function () {
  var isLocalHost = window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  var BASE = window.API_BASE
    || ((window.location && window.location.port === '5001')
      ? ''
      : (isLocalHost ? 'http://localhost:5001' : 'https://jobportal-api-nhom6.onrender.com'));
  var SALARY_UNIT = 1000000; // form nhập "triệu đồng", CSDL lưu đồng (đổi nếu nhóm lưu đơn vị khác)

  // Bảo vệ phân quyền trang Nhà tuyển dụng (Client-side RBAC Guard)
  (function enforceEmployerRole() {
    try {
      var token = (window.JobPortalAPI && typeof window.JobPortalAPI.getToken === 'function' && window.JobPortalAPI.getToken())
        || localStorage.getItem('jobportal_access_token')
        || window.accessToken
        || localStorage.getItem('accessToken');
      var raw = localStorage.getItem('jobportal_session');
      var sess = raw ? JSON.parse(raw) : null;
      if (!token || !sess) {
        window.location.replace('./auth.html?mode=login');
        return;
      }
      var role = String(sess.role || '').toLowerCase();
      if (role === 'candidate') {
        window.location.replace('./candidate-dashboard.html');
      } else if (role === 'admin') {
        window.location.replace('./admin-portal.html');
      }
    } catch (_) {}
  })();

  // Token truy cập: đồng bộ chuẩn key `jobportal_access_token` của JobPortalAPI
  function getRawToken() {
    try {
      return (window.JobPortalAPI && typeof window.JobPortalAPI.getToken === 'function' && window.JobPortalAPI.getToken())
        || localStorage.getItem('jobportal_access_token')
        || window.accessToken
        || localStorage.getItem('accessToken')
        || '';
    } catch (e) { return ''; }
  }

  function authHeader() {
    var t = getRawToken();
    return t ? { Authorization: 'Bearer ' + t } : {};
  }

  function request(method, path, body) {
    var headers = Object.assign({ Accept: 'application/json' }, authHeader());
    if (body) headers['Content-Type'] = 'application/json';
    return Promise.resolve().then(function () {
      return fetch(BASE + '/api/v1/employer' + path, {
        method: method,
        headers: headers,
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined
      });
    }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (json) {
        if (res.status === 401) window.location.href = './auth.html?mode=login';
        if (!res.ok || !json || json.success === false) {
          var err = new Error((json && json.message) || 'Lỗi máy chủ (' + res.status + ').');
          err.status = res.status;
          err.errors = (json && json.errors) || null;
          err.notJson = (json === null); // máy chủ tĩnh (Live Server) trả HTML, không phải API
          throw err;
        }
        return json;
      });
    });
  }

  // Không có mạng / không có API -> trả rỗng kèm cảnh báo lỗi thật (không dùng MOCK DB)
  function isOffline(err) { return !err.status || err.notJson; }

  function fail(err) {
    if (err && err.status === 401) return;
    window.showToast((err && err.message) || 'Có lỗi xảy ra.', 'error');
  }

  // Trạng thái hiển thị (khóa giao diện) <-> giá trị lưu ở CSDL
  var STATUS = {
    new:       { text: 'Mới nhận',      cls: 'status-new' },
    viewed:    { text: 'Đã xem',        cls: 'status-viewed' },
    interview: { text: 'Hẹn phỏng vấn', cls: 'status-interview' },
    approved:  { text: 'Đã duyệt',      cls: 'status-approved' },
    rejected:  { text: 'Từ chối',       cls: 'status-rejected' }
  };
  var API_STATUS = { viewed: 'viewed', interview: 'interview', approved: 'accepted', rejected: 'rejected' };

  function statusKey(raw) {
    var s = String(raw || '').toLowerCase();
    if (s === 'viewed') return 'viewed';
    if (s === 'interview' || s === 'interview_scheduled') return 'interview';
    if (s === 'accepted' || s === 'approved') return 'approved';
    if (s === 'rejected') return 'rejected';
    return 'new'; // trạng thái ban đầu (đã nộp / chờ xử lý)
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(v) {
    if (!v) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v)); // ngày thuần YYYY-MM-DD: không qua múi giờ
    if (m) return m[3] + '/' + m[2] + '/' + m[1];
    var d = new Date(v);
    if (isNaN(d)) return esc(v);
    function p(n) { return n < 10 ? '0' + n : n; }
    return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function loadDashboard() {
    return request('GET', '/dashboard').then(function (j) {
      return { data: j.data, offline: false };
    }).catch(function (err) {
      if (!isOffline(err)) throw err;
      window.showToast('Không thể kết nối máy chủ API để tải dữ liệu nhà tuyển dụng.', 'error');
      return { data: { kpi: { activeJobs: 0, pendingJobs: 0, totalApplications: 0, interviews: 0 }, jobs: [], applications: [] }, offline: true };
    });
  }

  function updateStatus(id, key, offline) {
    if (offline) {
      return Promise.reject(new Error('Không kết nối được máy chủ API để cập nhật trạng thái.'));
    }
    return request('PATCH', '/applications/' + id + '/status', { status: API_STATUS[key] }).then(function (j) { return j.data; });
  }

  function loadMeta() { return request('GET', '/meta').then(function (j) { return j.data; }); }
  function createJob(payload) { return request('POST', '/jobs', payload); }

  return {
    SALARY_UNIT: SALARY_UNIT, STATUS: STATUS, statusKey: statusKey, esc: esc, fmtDate: fmtDate,
    isOffline: isOffline, fail: fail,
    loadDashboard: loadDashboard, updateStatus: updateStatus, loadMeta: loadMeta, createJob: createJob
  };
})();


/* ---------- PHẦN A: DASHBOARD (SIDEBAR, THÔNG BÁO, KPI, BẢNG) ---------- */
document.addEventListener('DOMContentLoaded', function () {

  var $ = function (id) { return document.getElementById(id); };
  var esc = EmployerAPI.esc;
  var STATUS = EmployerAPI.STATUS;

  // 0. ĐỒNG BỘ TÊN NHÀ TUYỂN DỤNG & XỬ LÝ ĐĂNG XUẤT
  (function hydrateEmployerHeader() {
    try {
      var raw = localStorage.getItem('jobportal_session');
      var sess = raw ? JSON.parse(raw) : null;
      if (sess) {
        var displayName = sess.company_name || sess.full_name || sess.email || 'Nhà tuyển dụng';
        var initial = String(displayName).trim().slice(0, 2).toUpperCase() || 'HR';
        document.querySelectorAll('.emp-user-name').forEach(function (el) { el.textContent = displayName; });
        document.querySelectorAll('.emp-avatar').forEach(function (el) { el.textContent = initial; });
      }
    } catch (_) {}

    document.querySelectorAll('.emp-sidebar-foot a[href*="auth.html"]').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.JobPortalAPI && typeof window.JobPortalAPI.clearAuthSession === 'function') {
          window.JobPortalAPI.clearAuthSession();
        } else {
          try {
            localStorage.removeItem('jobportal_access_token');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('jobportal_session');
          } catch (_) {}
        }
      });
    });
  })();

  // 1. SIDEBAR: luôn hiện trên desktop; trên mobile là Drawer trượt ra (nút ☰ chỉ hiện ở mobile)
  var sidebar = $('empSidebar');
  var backdrop = $('empBackdrop');
  var toggleBtn = $('btnToggleSidebar');

  function isMobile() { return window.matchMedia('(max-width: 1024px)').matches; }
  function closeDrawer() {
    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    toggleBtn.setAttribute('aria-expanded', 'false');
  }

  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      backdrop.classList.toggle('is-visible', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
    });
    backdrop.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    window.addEventListener('resize', function () { if (!isMobile()) closeDrawer(); });
  }

  // 2. THÔNG BÁO TRÊN TOPBAR (Tạo động từ dữ liệu API Dashboard, không hardcode dữ liệu giả)
  var notifBtn = $('btnNotif');
  var notifPanel = $('notifPanel');
  var notifList = $('notifList');
  var notifCount = $('notifCount');

  var notifications = [];

  // Nhớ trạng thái đã đọc giữa các trang (an toàn khi trình duyệt chặn storage)
  var READ_KEY = 'emp_notif_read';
  function loadRead() { try { return JSON.parse(localStorage.getItem(READ_KEY)) || []; } catch (e) { return []; } }
  function saveRead(ids) { try { localStorage.setItem(READ_KEY, JSON.stringify(ids)); } catch (e) {} }
  var readIds = loadRead();
  function isRead(n) { return n.read || readIds.indexOf(n.id) !== -1; }

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
        '<span class="notif-body"><div class="notif-title">' + esc(n.title) + '</div>' +
        '<div class="notif-text">' + esc(n.text) + '</div>' +
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
    notifBtn.addEventListener('click', function (e) { e.stopPropagation(); setNotifOpen(notifPanel.hidden); });

    // Event delegation: bấm vào 1 thông báo -> đánh dấu đã đọc (rồi chuyển trang theo href)
    notifList.addEventListener('click', function (e) {
      var item = e.target.closest('.notif-item');
      if (!item) return;
      if (readIds.indexOf(item.dataset.id) === -1) readIds.push(item.dataset.id);
      saveRead(readIds);
    });
    $('btnMarkAllRead').addEventListener('click', function () {
      readIds = notifications.map(function (n) { return n.id; });
      saveRead(readIds);
      renderNotifs();
    });
    document.addEventListener('click', function (e) {
      if (!notifPanel.hidden && !notifPanel.contains(e.target)) setNotifOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !notifPanel.hidden) { setNotifOpen(false); notifBtn.focus(); }
    });
  }

  // 3. DASHBOARD: KPI + bảng (chỉ chạy ở employer-dashboard.html) — dữ liệu từ GET /employer/dashboard
  var recentBody = $('recentTableBody');
  if (recentBody) {
    var jobsBody = $('jobsTableBody');
    var recentEmpty = $('recentEmpty');
    var dash = null;
    var offline = false;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function animateCount(el, target) {
      if (!el) return;
      target = Number(target) || 0;
      if (reduce) { el.textContent = target.toLocaleString('vi-VN'); return; }
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 800, 1);
        el.textContent = Math.round(target * p).toLocaleString('vi-VN');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    function renderKpi() {
      var k = dash.kpi;
      animateCount($('kpiActive'), k.activeJobs);
      animateCount($('kpiTotalCv'), k.totalApplications);
      animateCount($('kpiInterview'), k.interviews);
      animateCount($('kpiPending'), k.pendingJobs);
    }

    function renderRecent() {
      var list = dash.applications.slice(0, 5);
      recentEmpty.hidden = list.length > 0;
      recentBody.innerHTML = list.map(function (a) {
        var key = EmployerAPI.statusKey(a.status);
        var st = STATUS[key];
        var actions = (key === 'new' || key === 'viewed')
          ? '<button type="button" class="btn btn-primary btn-sm" data-act="interview" data-id="' + a.application_id + '">Hẹn phỏng vấn</button>' +
            '<button type="button" class="btn btn-danger-outline btn-sm" data-act="rejected" data-id="' + a.application_id + '">Từ chối</button>'
          : '<a href="./candidate-management.html" class="btn btn-ghost btn-sm">Xem chi tiết</a>';
        return '<tr>' +
          '<td data-label="Ứng viên"><div class="cell-strong">' + esc(a.applicant_name) + '</div></td>' +
          '<td data-label="Vị trí">' + esc(a.job_title) + '</td>' +
          '<td data-label="Ngày nộp">' + EmployerAPI.fmtDate(a.applied_at) + '</td>' +
          '<td data-label="Trạng thái"><span class="status ' + st.cls + '">' + st.text + '</span></td>' +
          '<td data-label="Thao tác"><div class="row-actions">' + actions + '</div></td></tr>';
      }).join('');
    }

    function jobStatusInfo(j) {
      var expired = j.deadline && new Date(j.deadline) < new Date(new Date().toDateString());
      if (j.status === 'approved' && expired) return { text: 'Hết hạn', cls: 'status-viewed' };
      if (j.status === 'approved') return { text: 'Đang hiển thị', cls: 'status-approved' };
      if (j.status === 'rejected') return { text: 'Bị từ chối', cls: 'status-rejected' };
      if (j.status === 'closed') return { text: 'Đã đóng', cls: 'status-viewed' };
      return { text: 'Chờ duyệt', cls: 'status-new' };
    }

    function renderJobs() {
      if (!dash.jobs.length) {
        jobsBody.innerHTML = '<tr><td colspan="4" class="emp-empty">Chưa có tin tuyển dụng. <a href="./post-job.html" style="color: var(--color-primary); font-weight: 600;">Đăng tin đầu tiên</a>.</td></tr>';
        return;
      }
      jobsBody.innerHTML = dash.jobs.map(function (j) {
        var st = jobStatusInfo(j);
        return '<tr>' +
          '<td data-label="Chức danh"><div class="cell-strong">' + esc(j.title) + '</div><div class="cell-sub">' + esc(j.location_name || '') + '</div></td>' +
          '<td data-label="Hạn nộp">' + EmployerAPI.fmtDate(j.deadline) + '</td>' +
          '<td data-label="Hồ sơ">' + (Number(j.application_count) || 0) + '</td>' +
          '<td data-label="Trạng thái"><span class="status ' + st.cls + '">' + st.text + '</span></td></tr>';
      }).join('');
    }

    // Đổi trạng thái bằng event delegation -> PATCH /employer/applications/:id/status
    recentBody.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]');
      if (!btn) return;
      var id = Number(btn.dataset.id);
      var key = btn.dataset.act;
      var item = dash.applications.find(function (a) { return a.application_id === id; });
      if (!item) return;
      btn.disabled = true;
      EmployerAPI.updateStatus(id, key, offline).then(function (r) {
        item.status = r.status;
        item.viewed_at = r.viewed_at;
        dash.kpi.interviews = dash.applications.filter(function (a) { return EmployerAPI.statusKey(a.status) === 'interview'; }).length;
        renderRecent();
        renderKpi();
        window.showToast(
          key === 'rejected' ? 'Đã từ chối hồ sơ của ' + item.applicant_name + '.' : 'Đã hẹn phỏng vấn ' + item.applicant_name + '.',
          key === 'rejected' ? 'warning' : 'success'
        );
      }).catch(function (err) { btn.disabled = false; EmployerAPI.fail(err); });
    });

    EmployerAPI.loadDashboard().then(function (r) {
      dash = r.data;
      offline = r.offline;
      renderKpi();
      renderRecent();
      renderJobs();
    }).catch(EmployerAPI.fail);
  }
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
  var submitBtn = form.querySelector('button[type="submit"]');

  // Hạn nộp tối thiểu là ngày mai
  var tomorrow = new Date(Date.now() + 86400000);
  $('deadline').min = tomorrow.toISOString().slice(0, 10);

  // Nạp ngành nghề + địa điểm thật từ API
  function fillSelect(sel, items, idKey, nameKey, placeholder) {
    if (!sel || !items || !items.length) return;
    sel.innerHTML = '<option value="">' + placeholder + '</option>' + items.map(function (it) {
      return '<option value="' + EmployerAPI.esc(it[idKey]) + '">' + EmployerAPI.esc(it[nameKey]) + '</option>';
    }).join('');
  }
  EmployerAPI.loadMeta().then(function (m) {
    fillSelect($('jobCategory'), m.categories, 'category_id', 'category_name', 'Chọn ngành nghề');
    fillSelect($('jobLocation'), m.locations, 'location_id', 'location_name', 'Chọn địa điểm');
  }).catch(EmployerAPI.fail);

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
    if (!el) return;
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

    var loc = $('jobLocation');
    if (!loc.value) fail(loc, 'Vui lòng chọn địa điểm.'); else setError(loc, '');

    if (!negotiable.checked) {
      var min = Number(salaryMin.value), max = Number(salaryMax.value);
      if (!salaryMin.value || !salaryMax.value) { fail(salaryMax, 'Nhập mức lương hoặc chọn "Lương thỏa thuận".'); }
      else if (min <= 0 || max < min) { fail(salaryMax, 'Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.'); }
      else setError(salaryMax, '');
    } else setError(salaryMax, '');

    var dl = $('deadline');
    if (!dl.value || new Date(dl.value) < new Date(dl.min)) fail(dl, 'Hạn nộp phải từ ngày mai trở đi.'); else setError(dl, '');

    if (editor.textContent.trim().length < 30) fail(editor, 'Mô tả cần ít nhất 30 ký tự.'); else setError(editor, '');

    var req = $('jobRequirements');
    if (req.value.trim().length < 10) fail(req, 'Yêu cầu ứng viên cần ít nhất 10 ký tự.'); else setError(req, '');

    return ok;
  }

  // Tên trường server báo lỗi -> ô nhập trên form
  var FIELD_TO_INPUT = {
    title: 'jobTitle', category_id: 'jobCategory', location_id: 'jobLocation', employment_type: 'employmentType',
    salary_min: 'salaryMax', salary_max: 'salaryMax', deadline: 'deadline', description: 'jobDescription',
    requirements: 'jobRequirements', benefits: 'jobBenefits', experience_level: 'experienceLevel'
  };

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      window.showToast('Vui lòng kiểm tra lại các trường báo lỗi.', 'error');
      var bad = form.querySelector('.is-invalid');
      if (bad) bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Mô tả gửi dạng văn bản thuần để tránh chèn mã HTML độc hại vào trang công khai
    var payload = {
      title: $('jobTitle').value.trim(),
      category_id: Number($('jobCategory').value),
      location_id: Number($('jobLocation').value),
      employment_type: $('employmentType').value,
      experience_level: $('experienceLevel').value,
      is_negotiable: negotiable.checked,
      salary_min: negotiable.checked ? null : Number(salaryMin.value) * EmployerAPI.SALARY_UNIT,
      salary_max: negotiable.checked ? null : Number(salaryMax.value) * EmployerAPI.SALARY_UNIT,
      deadline: $('deadline').value,
      description: (editor.innerText || editor.textContent).trim(),
      requirements: $('jobRequirements').value.trim(),
      benefits: $('jobBenefits').value.trim()
    };

    function done(message) {
      window.showToast(message, 'success');
      setTimeout(function () { window.location.href = './employer-dashboard.html'; }, 1500);
    }

    submitBtn.disabled = true;
    EmployerAPI.createJob(payload).then(function (json) {
      done(json.message || 'Đã gửi tin tuyển dụng, đang chờ quản trị viên duyệt.');
    }).catch(function (err) {
      submitBtn.disabled = false;
      if (err.errors && err.errors.length) {
        err.errors.forEach(function (it) {
          var input = $(FIELD_TO_INPUT[it.field]);
          if (input) setError(input, it.message);
        });
      }
      EmployerAPI.fail(err);
    });
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

  var esc = EmployerAPI.esc;
  var STATUS = EmployerAPI.STATUS;
  var candidates = [];
  var offline = false;
  var currentFilter = 'all';
  var keyword = '';
  var openId = null;

  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }
  function find(id) { return candidates.find(function (x) { return x.application_id === id; }); }

  function updateCounts() {
    document.querySelectorAll('.filter-tab').forEach(function (tab) {
      var f = tab.dataset.filter;
      var n = f === 'all' ? candidates.length : candidates.filter(function (c) { return EmployerAPI.statusKey(c.status) === f; }).length;
      tab.querySelector('.tab-count').textContent = n;
    });
  }

  function actionButtons(c) {
    var current = EmployerAPI.statusKey(c.status);
    var defs = [['approved', 'Duyệt', 'btn-accent'], ['interview', 'Hẹn PV', 'btn-primary'], ['rejected', 'Từ chối', 'btn-danger-outline']];
    return defs.filter(function (d) { return d[0] !== current; }).map(function (d) {
      return '<button type="button" class="btn ' + d[2] + ' btn-sm" data-act="' + d[0] + '" data-id="' + c.application_id + '">' + d[1] + '</button>';
    }).join('');
  }

  function render() {
    var list = candidates.filter(function (c) {
      return (currentFilter === 'all' || EmployerAPI.statusKey(c.status) === currentFilter) &&
             (!keyword || norm(c.applicant_name + ' ' + c.job_title).indexOf(norm(keyword)) !== -1);
    });
    document.getElementById('candEmpty').hidden = list.length > 0;
    tbody.innerHTML = list.map(function (c) {
      var st = STATUS[EmployerAPI.statusKey(c.status)];
      return '<tr>' +
        '<td data-label="Ứng viên"><div class="cell-strong">' + esc(c.applicant_name) + '</div><div class="cell-sub">' + esc(c.applicant_email) + '</div></td>' +
        '<td data-label="Vị trí">' + esc(c.job_title) + '</td>' +
        '<td data-label="Ngày nộp">' + EmployerAPI.fmtDate(c.applied_at) + '</td>' +
        '<td data-label="Trạng thái"><span class="status ' + st.cls + '">' + st.text + '</span></td>' +
        '<td data-label="Thao tác"><div class="row-actions">' +
          '<button type="button" class="btn btn-outline btn-sm" data-view="' + c.application_id + '">Xem CV</button>' + actionButtons(c) +
        '</div></td></tr>';
    }).join('');
    updateCounts();
  }

  // Gọi PATCH rồi cập nhật dòng tương ứng
  function setStatus(id, key, quiet) {
    var c = find(id);
    if (!c) return Promise.resolve();
    return EmployerAPI.updateStatus(id, key, offline).then(function (r) {
      c.status = r.status;
      c.viewed_at = r.viewed_at;
      render();
      if (!quiet) {
        var msg = { approved: 'Đã duyệt hồ sơ của ', interview: 'Đã hẹn phỏng vấn ', rejected: 'Đã từ chối hồ sơ của ' }[key];
        window.showToast(msg + c.applicant_name + '.', key === 'rejected' ? 'warning' : 'success');
      }
    }).catch(EmployerAPI.fail);
  }

  // Modal xem nhanh CV
  var modal = document.getElementById('cvModal');
  var lastFocus = null;

  function safeUrl(u) { return /^(https?:\/\/|\/)/.test(u || '') ? u : ''; }

  function fillModal(c) {
    var st = STATUS[EmployerAPI.statusKey(c.status)];
    var url = safeUrl(c.resume_snapshot_url);
    var cvHref = url;
    if (url && url.indexOf('/uploads/cv/') !== -1) {
      var tok = '';
      try { tok = localStorage.getItem('jobportal_access_token') || ''; } catch (_) {}
      if (tok) cvHref = url + (url.indexOf('?') === -1 ? '?token=' : '&token=') + encodeURIComponent(tok);
    }
    var cvPart = url
      ? '<span>📄 ' + esc(decodeURIComponent(url.split('/').pop())) + '</span><a href="' + esc(cvHref) + '" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Mở CV</a>'
      : '<span>📄 Ứng viên chưa đính kèm tệp CV.</span>';
    document.getElementById('cvModalTitle').textContent = c.applicant_name;
    document.getElementById('cvModalBody').innerHTML =
      '<div class="info-row"><span>Vị trí</span><strong>' + esc(c.job_title) + '</strong></div>' +
      '<div class="info-row"><span>Email</span><strong>' + esc(c.applicant_email) + '</strong></div>' +
      '<div class="info-row"><span>Điện thoại</span><strong>' + esc(c.applicant_phone || 'Không có') + '</strong></div>' +
      '<div class="info-row"><span>Ngày nộp</span><strong>' + EmployerAPI.fmtDate(c.applied_at) + '</strong></div>' +
      '<div class="info-row"><span>Trạng thái</span><span class="status ' + st.cls + '">' + st.text + '</span></div>' +
      '<div class="cv-box">' + cvPart + '</div>' +
      '<div><div class="emp-label-text" style="margin-bottom:6px;">Thư giới thiệu</div><div class="letter-box">' + (c.cover_letter ? esc(c.cover_letter) : 'Ứng viên không gửi thư giới thiệu.') + '</div></div>';
  }

  function openModal(id) {
    var c = find(id);
    if (!c) return;
    openId = id;
    lastFocus = document.activeElement;
    fillModal(c);
    modal.classList.add('is-open');
    document.getElementById('btnCloseCv').focus();
    // Mở xem CV lần đầu -> tự chuyển "Mới nhận" thành "Đã xem" (server ghi viewed_at)
    if (EmployerAPI.statusKey(c.status) === 'new') {
      setStatus(id, 'viewed', true).then(function () { if (openId === id) fillModal(find(id)); });
    }
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
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
    var a = e.target.closest('[data-modal-act]');
    if (a && openId) { var id = openId; closeModal(); setStatus(id, a.dataset.modalAct); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

  // Tải danh sách hồ sơ từ GET /employer/dashboard
  EmployerAPI.loadDashboard().then(function (r) {
    candidates = r.data.applications || [];
    offline = r.offline;
    render();
  }).catch(EmployerAPI.fail);
});
