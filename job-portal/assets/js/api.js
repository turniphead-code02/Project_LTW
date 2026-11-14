/**
 * ============================================================================
 * BỘ KHÁCH GỌI REST API DÙNG CHUNG CHO FRONTEND (SHARED API CLIENT)
 * Thành viên phụ trách Core: TRẦN HỮU THÀNH (MSSV: 044206000003 - Nhóm trưởng)
 * Dùng chung cho cả 5 Module để gọi Backend Express (/api/v1/...)
 * ============================================================================
 */

(function () {
  var API_BASE_URL = window.JOBPORTAL_API_BASE || 'http://localhost:5000/api/v1';
  var TOKEN_KEY = 'jobportal_access_token';
  var SESSION_KEY = 'jobportal_session';

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setAuthSession(accessToken, user) {
    try {
      if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
      if (user) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            id: user.user_id,
            user_id: user.user_id,
            fullName: user.full_name,
            name: user.full_name,
            email: user.email,
            role: user.role,
            loginAt: new Date().toISOString()
          })
        );
      }
    } catch (e) {
      console.error('Không thể lưu phiên đăng nhập:', e);
    }
  }

  function clearAuthSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  async function request(endpoint, options) {
    var opts = options || {};
    var headers = Object.assign({}, opts.headers || {});
    var token = getToken();

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    if (!(opts.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    var url = endpoint.indexOf('http') === 0 ? endpoint : API_BASE_URL + endpoint;
    var response = await fetch(url, {
      method: opts.method || 'GET',
      headers: headers,
      body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: 'include'
    });

    var payload = await response.json();
    if (!response.ok || payload.success === false) {
      var err = new Error(payload.message || 'Lỗi kết nối máy chủ API');
      err.code = payload.code || response.status;
      err.payload = payload;
      throw err;
    }
    return payload;
  }

  window.JobPortalAPI = {
    BASE_URL: API_BASE_URL,
    getToken: getToken,
    setAuthSession: setAuthSession,
    clearAuthSession: clearAuthSession,
    get: function (endpoint) {
      return request(endpoint, { method: 'GET' });
    },
    post: function (endpoint, body) {
      return request(endpoint, { method: 'POST', body: body });
    },
    put: function (endpoint, body) {
      return request(endpoint, { method: 'PUT', body: body });
    },
    patch: function (endpoint, body) {
      return request(endpoint, { method: 'PATCH', body: body });
    },
    delete: function (endpoint) {
      return request(endpoint, { method: 'DELETE' });
    },
    upload: function (endpoint, formData) {
      return request(endpoint, { method: 'POST', body: formData });
    }
  };
})();
