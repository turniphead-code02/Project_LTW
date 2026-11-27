
/* =========================================
   JOBPORTAL - ADMIN MANAGEMENT (API REAL)
   Đồng bộ với Shared API Client
========================================= */

const API = window.JobPortalAPI;

let employers = [];
let jobs = [];

/* =========================================
   1. THÔNG BÁO TOAST
========================================= */

function showToast(message, type = "success") {
    let container = document.getElementById("admin-toast-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "admin-toast-container";

        Object.assign(container.style, {
            position: "fixed",
            top: "25px",
            right: "25px",
            zIndex: "99999",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    const background =
        type === "error" ? "#dc2626" :
        type === "warning" ? "#d97706" :
        "#16a34a";

    Object.assign(toast.style, {
        background,
        color: "#fff",
        padding: "15px 22px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 5px 20px rgba(0,0,0,0.15)",
        opacity: "0",
        transform: "translateY(-10px)",
        transition: "all 0.25s ease"
    });

    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";

        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* =========================================
   2. HÀM HỖ TRỢ
========================================= */

function formatAdminSalary(minRaw, maxRaw) {
    const min = Number(minRaw);
    const max = Number(maxRaw);
    const toTrieu = v => {
        const val = v >= 100000 ? v / 1e6 : v;
        return Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
    };

    if (min > 0 && max > 0) {
        return `${toTrieu(min)} - ${toTrieu(max)} triệu`;
    }
    if (min > 0) {
        return `Từ ${toTrieu(min)} triệu`;
    }
    if (max > 0) {
        return `Đến ${toTrieu(max)} triệu`;
    }
    return "Thỏa thuận";
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getStatusBadge(status) {
    const labels = {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Đã từ chối",
        locked: "Đã khóa",
        active: "Hoạt động",
        closed: "Đã đóng"
    };

    return `
        <span class="status-badge status-${escapeHTML(status)}">
            ${escapeHTML(labels[status] || status)}
        </span>
    `;
}

function getErrorMessage(error) {
    return error?.message || "Đã xảy ra lỗi khi xử lý yêu cầu.";
}

/* =========================================
   3. KIỂM TRA PHIÊN ADMIN
========================================= */

function checkAdminSession() {
    const token = localStorage.getItem("jobportal_access_token");

    let session = null;

    try {
        session = JSON.parse(
            localStorage.getItem("jobportal_session")
        );
    } catch (error) {
        console.error("Không đọc được phiên đăng nhập:", error);
    }

    if (!token || !session) {
        alert("Phiên đăng nhập không tồn tại. Vui lòng đăng nhập lại!");
        window.location.replace("./auth.html");
        return false;
    }

    if (session.role !== "admin") {
        alert("Bạn không có quyền truy cập trang quản trị!");

        window.location.replace("./index.html");
        return false;
    }

    if (!API) {
        alert("Không tải được API Client. Vui lòng kiểm tra api.js!");
        return false;
    }

    return true;
}

/* =========================================
   4. XỬ LÝ PHIÊN HẾT HẠN
========================================= */

function handleApiError(error) {
    console.error("Lỗi Admin API:", error);

    const code = Number(error?.code);

    if (code === 401) {
        API.clearAuthSession();

        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");

        window.location.replace("./auth.html");
        return;
    }

    if (code === 403) {
        showToast("Tài khoản không có quyền quản trị.", "error");
        return;
    }

    showToast(getErrorMessage(error), "error");
}

/* =========================================
   5. LẤY DỮ LIỆU QUẢN TRỊ TỪ DATABASE
========================================= */

async function fetchAdminOverview() {
    try {
        const result = await API.get("/admin/overview");

        if (!result || !result.success || !result.data) {
            throw new Error(
                result?.message || "Không thể tải dữ liệu quản trị."
            );
        }

        const data = result.data;

        employers = (data.employers || []).map(emp => ({
            id: emp.company_id || emp.user_id,
            userId: emp.user_id,
            name: emp.company_name || emp.full_name || "Chưa có tên",
            email: emp.email || "",
            date: emp.created_at
                ? new Date(emp.created_at).toLocaleDateString("vi-VN")
                : "Chưa có dữ liệu",
            status: emp.user_status === "locked" ? "locked" : "active"
        }));

        jobs = (data.jobs || []).map(job => ({
            id: job.job_id,
            title: job.title || "Chưa có tiêu đề",
            company: job.company_name || "Chưa có doanh nghiệp",
            salary: formatAdminSalary(job.salary_min, job.salary_max),
            status: job.status,
            reject_reason: job.reject_reason
        }));

        renderEmployers();
        renderJobs();
        updateStatistics();

    } catch (error) {
        handleApiError(error);
    }
}

/* =========================================
   6. CẬP NHẬT THỐNG KÊ
========================================= */

function updateStatistics() {
    const lockedEmployers = employers.filter(
        item => item.status === "locked"
    ).length;

    const pendingJobs = jobs.filter(
        item => item.status === "pending"
    ).length;

    const statistics = {
        "total-employers": employers.length,
        "pending-employers": lockedEmployers,
        "total-jobs": jobs.length,
        "pending-jobs": pendingJobs,
        "employer-count": employers.length,
        "job-count": pendingJobs
    };

    Object.entries(statistics).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    });

    const overviewEmp = document.getElementById("overview-employer-count");
    if (overviewEmp) {
        overviewEmp.textContent = lockedEmployers > 0
            ? `${lockedEmployers} tài khoản đang bị khóa`
            : `${employers.length} doanh nghiệp đang hoạt động`;
    }

    const overviewJob = document.getElementById("overview-job-count");
    if (overviewJob) {
        overviewJob.textContent = `${pendingJobs} tin đang chờ duyệt`;
    }
}

/* =========================================
   7. HIỂN THỊ DOANH NGHIỆP / NGƯỜI DÙNG
========================================= */

function renderEmployers() {
    const tbody = document.getElementById("employer-table-body");
    const emptyEl = document.getElementById("employer-empty");

    if (!tbody) return;

    const searchInput = document.getElementById("employer-search");
    const filterSelect = document.getElementById("employer-filter");

    const keyword = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";
    const statusFilter = filterSelect ? filterSelect.value : "all";

    const filtered = employers.filter(item => {
        const matchKeyword =
            item.name.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword);
        const matchStatus =
            statusFilter === "all" || item.status === statusFilter;
        return matchKeyword && matchStatus;
    });

    if (emptyEl) {
        emptyEl.hidden = filtered.length > 0;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <strong>${escapeHTML(item.name)}</strong>
            </td>

            <td>${escapeHTML(item.email)}</td>

            <td>${escapeHTML(item.date)}</td>

            <td>${getStatusBadge(item.status)}</td>

            <td>
                <div class="action-buttons">
                    <button
                        class="action-btn ${item.status === "locked" ? "approve-btn" : "reject-btn"}"
                        data-type="user"
                        data-id="${item.userId}"
                        data-action="${item.status === "locked" ? "active" : "locked"}">

                        ${item.status === "locked" ? "Mở khóa" : "Khóa"}
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

/* =========================================
   8. HIỂN THỊ TIN TUYỂN DỤNG
========================================= */

function renderJobs() {
    const tbody = document.getElementById("job-table-body");
    const emptyEl = document.getElementById("job-empty");

    if (!tbody) return;

    const searchInput = document.getElementById("job-search");
    const filterSelect = document.getElementById("job-filter");

    const keyword = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";
    const statusFilter = filterSelect ? filterSelect.value : "all";

    const filtered = jobs.filter(item => {
        const matchKeyword =
            item.title.toLowerCase().includes(keyword) ||
            item.company.toLowerCase().includes(keyword);
        const matchStatus =
            statusFilter === "all" || item.status === statusFilter;
        return matchKeyword && matchStatus;
    });

    if (emptyEl) {
        emptyEl.hidden = filtered.length > 0;
    }

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <strong>${escapeHTML(item.title)}</strong>
            </td>

            <td>${escapeHTML(item.company)}</td>

            <td>${escapeHTML(item.salary)}</td>

            <td>${getStatusBadge(item.status)}</td>

            <td>
                <div class="action-buttons">

                    <button
                        class="action-btn approve-btn"
                        data-type="job"
                        data-id="${item.id}"
                        data-action="approved"
                        ${item.status === "approved" ? "disabled" : ""}>
                        Duyệt
                    </button>

                    <button
                        class="action-btn reject-btn"
                        data-type="job"
                        data-id="${item.id}"
                        data-action="rejected"
                        ${item.status === "rejected" ? "disabled" : ""}>
                        Từ chối
                    </button>

                </div>
            </td>
        </tr>
    `).join("");
}

/* =========================================
   9. DUYỆT TIN / KHÓA TÀI KHOẢN
========================================= */

async function handleModeration(event) {
    const button = event.target.closest("[data-action]");

    if (!button || button.disabled) return;

    const type = button.dataset.type;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (!id || !action) return;

    button.disabled = true;

    try {
        if (type === "job") {
            let reject_reason = null;

            if (action === "rejected") {
                reject_reason = prompt(
                    "Nhập lý do từ chối bài đăng này:"
                );

                if (reject_reason === null) {
                    button.disabled = false;
                    return;
                }

                reject_reason = reject_reason.trim() ||
                    "Không đạt yêu cầu kiểm duyệt.";
            }

            const result = await API.patch(
                `/admin/jobs/${id}/status`,
                {
                    status: action,
                    reject_reason
                }
            );

            showToast(
                result.message || "Cập nhật tin tuyển dụng thành công."
            );

            await fetchAdminOverview();

        } else if (type === "user") {
            const confirmText = action === "locked"
                ? "Bạn có chắc chắn muốn khóa tài khoản này?"
                : "Bạn có chắc chắn muốn mở khóa tài khoản này?";

            if (!confirm(confirmText)) {
                button.disabled = false;
                return;
            }

            const result = await API.patch(
                `/admin/users/${id}/status`,
                {
                    status: action
                }
            );

            showToast(
                result.message || "Cập nhật tài khoản thành công."
            );

            await fetchAdminOverview();
        }

    } catch (error) {
        handleApiError(error);
        button.disabled = false;
    }
}

/* =========================================
   10. CHUYỂN TAB ADMIN
========================================= */

function switchSection(sectionId) {
    const target = document.getElementById(sectionId);

    if (!target) return;

    document.querySelectorAll(".admin-section").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    target.classList.add("active");

    const navItem = document.querySelector(
        `.nav-item[data-section="${sectionId}"]`
    );

    if (navItem) {
        navItem.classList.add("active");
    }
}

/* =========================================
   11. KHỞI TẠO ADMIN PORTAL
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Kiểm tra quyền Admin trước khi tải dữ liệu
    if (!checkAdminSession()) return;

    // Hiển thị thông tin Admin từ phiên đăng nhập
    try {
        const session = JSON.parse(localStorage.getItem("jobportal_session") || "null");
        const adminName = session?.full_name || "Administrator";
        const initial = adminName.trim().charAt(0).toUpperCase() || "A";
        const greetingEl = document.getElementById("admin-greeting");
        const sidebarNameEl = document.getElementById("admin-sidebar-name");
        const sidebarAvatarEl = document.getElementById("admin-sidebar-avatar");
        const topbarAvatarEl = document.getElementById("admin-topbar-avatar");
        if (greetingEl) greetingEl.textContent = `Xin chào, ${adminName}!`;
        if (sidebarNameEl) sidebarNameEl.textContent = adminName;
        if (sidebarAvatarEl) sidebarAvatarEl.textContent = initial;
        if (topbarAvatarEl) topbarAvatarEl.textContent = initial;
    } catch (_) {}

    // Chuyển tab
    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", function () {
            switchSection(this.dataset.section);
        });
    });

    // Đăng xuất quản trị viên
    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
            if (!confirm("Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?")) return;
            if (API && typeof API.clearAuthSession === "function") {
                API.clearAuthSession();
            } else {
                localStorage.removeItem("jobportal_access_token");
                localStorage.removeItem("jobportal_session");
            }
            showToast("Đã đăng xuất thành công!");
            setTimeout(() => {
                window.location.replace("./auth.html?mode=login");
            }, 300);
        });
    }

    // Xử lý duyệt tin và khóa tài khoản
    const adminMain = document.querySelector(".admin-main");

    if (adminMain) {
        adminMain.addEventListener("click", handleModeration);
    }

    // Tìm kiếm & lọc tin tuyển dụng
    const jobSearch = document.getElementById("job-search");
    const jobFilter = document.getElementById("job-filter");

    if (jobSearch) {
        jobSearch.addEventListener("input", renderJobs);
    }
    if (jobFilter) {
        jobFilter.addEventListener("change", renderJobs);
    }

    // Tìm kiếm & lọc doanh nghiệp
    const employerSearch = document.getElementById("employer-search");
    const employerFilter = document.getElementById("employer-filter");

    if (employerSearch) {
        employerSearch.addEventListener("input", renderEmployers);
    }
    if (employerFilter) {
        employerFilter.addEventListener("change", renderEmployers);
    }

    // Lưu & khôi phục cài đặt hệ thống
    const SETTINGS_KEY = "jobportal_admin_settings";
    const sysNameInput = document.getElementById("system-name");
    const adminEmailInput = document.getElementById("admin-email");
    const sysDescInput = document.getElementById("system-description");
    const saveSettingsBtn = document.getElementById("save-settings");

    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
        if (saved) {
            if (sysNameInput && saved.systemName) sysNameInput.value = saved.systemName;
            if (adminEmailInput && saved.adminEmail) adminEmailInput.value = saved.adminEmail;
            if (sysDescInput && saved.description) sysDescInput.value = saved.description;
        }
    } catch (_) {}

    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener("click", function () {
            const payload = {
                systemName: (sysNameInput?.value || "JobPortal").trim(),
                adminEmail: (adminEmailInput?.value || "admin@jobportal.com").trim(),
                description: (sysDescInput?.value || "").trim()
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
            showToast("Đã lưu cài đặt hệ thống!");
        });
    }

    // Tải dữ liệu từ Backend
    fetchAdminOverview();
});
