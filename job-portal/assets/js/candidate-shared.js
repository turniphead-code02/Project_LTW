/**
 * ============================================================================
 * TIỆN ÍCH DÙNG CHUNG CHO PHÂN HỆ ỨNG VIÊN (CANDIDATE SHARED UI & SECURITY)
 * - escapeHtml: Chống XSS khi render dữ liệu vào innerHTML
 * - resolveLogoUrl: Chuẩn hóa đường dẫn logo doanh nghiệp
 * - hydrateHeader: Đồng bộ tên & avatar người dùng
 * - openConfirm: Điều khiển modal xác nhận #candidateConfirmModal
 * - openSecurePdf: Mở/tải tệp CV qua header Authorization (không lộ JWT trên URL)
 * ============================================================================
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[c];
    });
  }

  function resolveLogoUrl(raw) {
    if (!raw) return '';
    var s = String(raw).trim();
    if (!s) return '';
    if (s.indexOf('/assets/') === 0) return '.' + s;
    if (s.indexOf('assets/') === 0) return './' + s;
    return s;
  }

  function hydrateHeader(userName) {
    var name = (userName && String(userName).trim()) || 'Ứng viên';
    var firstChar = name.charAt(0).toUpperCase() || 'U';
    var headerUserName = document.getElementById('headerUserName');
    var sidebarUserName = document.getElementById('sidebarUserName');
    if (headerUserName) headerUserName.textContent = name;
    if (sidebarUserName) sidebarUserName.textContent = name;
    document.querySelectorAll('.user-avatar, .profile-avatar').forEach(function (el) {
      el.textContent = firstChar;
    });
  }

  function openConfirm(title, message, onConfirm) {
    var modal = document.getElementById('candidateConfirmModal');
    var titleEl = document.getElementById('candConfirmTitle');
    var msgEl = document.getElementById('candConfirmMessage');
    var okBtn = document.getElementById('candConfirmOk');
    var cancelBtn = document.getElementById('candConfirmCancel');
    var closeBtn = document.getElementById('candConfirmClose');
    if (!modal || !okBtn) return;

    if (titleEl) titleEl.textContent = title || 'Xác nhận thao tác';
    if (msgEl) msgEl.textContent = message || '';

    var cleanup = function () {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      okBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
      if (closeBtn) closeBtn.onclick = null;
      modal.onclick = null;
    };

    okBtn.onclick = async function () {
      cleanup();
      if (typeof onConfirm === 'function') await onConfirm();
    };
    if (cancelBtn) cancelBtn.onclick = cleanup;
    if (closeBtn) closeBtn.onclick = cleanup;
    modal.onclick = function (e) { if (e.target === modal) cleanup(); };

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  async function openSecurePdf(rawUrl, fallbackName) {
    if (!rawUrl) return false;
    var API = global.JobPortalAPI;
    var baseOrigin = (API && API.BASE_URL) ? API.BASE_URL.replace('/api/v1', '') : '';
    var fullUrl = rawUrl.indexOf('http') === 0 ? rawUrl : (baseOrigin + rawUrl);
    var token = (API && typeof API.getToken === 'function' && API.getToken())
      || localStorage.getItem('jobportal_access_token')
      || '';

    var headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;

    var res = await fetch(fullUrl, { headers: headers, credentials: 'include' });
    if (!res.ok) {
      throw new Error('Không thể tải tệp CV (' + res.status + ').');
    }
    var blob = await res.blob();
    var blobUrl = URL.createObjectURL(blob);
    var opened = window.open(blobUrl, '_blank', 'noopener');
    if (!opened) {
      var a = document.createElement('a');
      a.href = blobUrl;
      a.download = fallbackName || 'CV.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 60000);
    return true;
  }

  global.CandidateUI = {
    escapeHtml: escapeHtml,
    resolveLogoUrl: resolveLogoUrl,
    hydrateHeader: hydrateHeader,
    openConfirm: openConfirm,
    openSecurePdf: openSecurePdf
  };
})(window);
