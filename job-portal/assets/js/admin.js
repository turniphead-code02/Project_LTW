
/* =========================================
   JOBPORTAL - ADMIN MANAGEMENT
========================================= */

"use strict";

const EMPLOYER_KEY = "jobportal_employers";
const USER_KEY = "jobportal_users";
const JOB_KEY = "jobportal_jobs";
const SETTINGS_KEY = "jobportal_settings";

const DEFAULT_EMPLOYERS = [
    {
        id: 1,
        name: "Công ty TNHH ABC Technology",
        email: "contact@abc.com",
        date: "08/11/2026",
        status: "pending"
    },
    {
        id: 2,
        name: "Công ty Cổ phần FPT",
        email: "hr@fpt.com",
        date: "07/11/2026",
        status: "pending"
    },
    {
        id: 3,
        name: "Công ty TNHH Tech Solutions",
        email: "hr@techsolutions.com",
        date: "05/11/2026",
        status: "approved"
    }
];

const DEFAULT_JOBS = [
    {
        id: 1,
        title: "Frontend Developer",
        company: "ABC Technology",
        salary: "15 - 20 triệu",
        status: "pending"
    },
    {
        id: 2,
        title: "Backend Developer",
        company: "FPT",
        salary: "20 - 30 triệu",
        status: "pending"
    },
    {
        id: 3,
        title: "UI/UX Designer",
        company: "Tech Solutions",
        salary: "12 - 18 triệu",
        status: "approved"
    }
];

const DEFAULT_SETTINGS = {
    systemName: "JobPortal",
    adminEmail: "admin@jobportal.com",
    description: "Nền tảng kết nối nhà tuyển dụng và ứng viên.",
    approveEmployer: true,
    approveJob: true
};

/* =========================================
   1. LOCAL STORAGE
========================================= */

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        console.error("Lỗi đọc Local Storage:", key, error);
        return fallback;
    }
}

function writeStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Lỗi lưu Local Storage:", key, error);
        showToast("Không thể lưu dữ liệu!", "error");
        return false;
    }
}

let employers = readStorage(EMPLOYER_KEY, null);
let jobs = readStorage(JOB_KEY, null);
let settings = readStorage(SETTINGS_KEY, null);

if (!Array.isArray(employers)) {
    employers = JSON.parse(JSON.stringify(DEFAULT_EMPLOYERS));
    writeStorage(EMPLOYER_KEY, employers);
}

if (!Array.isArray(jobs)) {
    jobs = JSON.parse(JSON.stringify(DEFAULT_JOBS));
    writeStorage(JOB_KEY, jobs);
}

if (!settings || typeof settings !== "object") {
    settings = { ...DEFAULT_SETTINGS };
}

/* =========================================
   2. TOAST
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
            zIndex: "999999",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });

        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    const colors = {
        success: "#16a34a",
        error: "#dc2626",
        warning: "#d97706"
    };

    Object.assign(toast.style, {
        background: colors[type] || colors.success,
        color: "#fff",
        padding: "15px 22px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 5px 20px rgba(0,0,0,.15)",
        opacity: "0",
        transform: "translateY(-10px)",
        transition: "all .25s ease"
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
    }, 2500);
}

/* =========================================
   3. HÀM HỖ TRỢ
========================================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getStatusText(status) {
    return {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Đã từ chối"
    }[status] || "Chờ duyệt";
}

function getStatusBadge(status) {
    return `
        <span class="status-badge status-${escapeHTML(status)}">
            ${escapeHTML(getStatusText(status))}
        </span>
    `;
}

function normalizeStatus(status) {
    const value = String(status || "").toLowerCase();

    if (["approved", "active", "accepted"].includes(value)) {
        return "approved";
    }

    if (["rejected", "declined", "denied"].includes(value)) {
        return "rejected";
    }

    return "pending";
}

function getEmployerName(user) {
    return user.companyName ||
        user.company ||
        user.businessName ||
        user.fullName ||
        user.name ||
        user.email ||
        "Doanh nghiệp chưa có tên";
}

function getUserRole(user) {
    return String(user.role || user.accountType || user.type || "")
        .toLowerCase();
}

/* =========================================
   4. ĐỒNG BỘ DOANH NGHIỆP ĐĂNG KÝ
========================================= */

function syncRegisteredEmployers() {
    const users = readStorage(USER_KEY, []);

    if (!Array.isArray(users)) return;

    let changed = false;

    users.forEach(user => {
        if (!user || typeof user !== "object") return;

        const role = getUserRole(user);

        // Chỉ lấy tài khoản nhà tuyển dụng/doanh nghiệp.
        if (
            !["employer", "company", "business", "nhatuyendung"]
                .includes(role)
        ) {
            return;
        }

        const email = String(user.email || "").trim().toLowerCase();

        if (!email) return;

        let employer = employers.find(item =>
            String(item.email || "").trim().toLowerCase() === email
        );

        if (!employer) {
            employer = {
                id: user.id ?? `user_${email}`,
                userId: user.id ?? null,
                name: getEmployerName(user),
                email: email,
                date: user.date || user.createdAt || new Date().toLocaleDateString("vi-VN"),
                status: normalizeStatus(user.status || user.approvalStatus),
                reason: user.reason || user.rejectionReason || ""
            };

            employers.push(employer);
            changed = true;
        } else {
            // Đồng bộ thông tin tài khoản nhưng không ghi đè trạng thái
            // đã được quản trị viên duyệt/từ chối.
            employer.userId = user.id ?? employer.userId;
            employer.name = getEmployerName(user);
            employer.email = email;
            changed = true;
        }
    });

    if (changed) {
        writeStorage(EMPLOYER_KEY, employers);
    }
}

/* =========================================
   5. ĐỒNG BỘ TRẠNG THÁI VỀ TÀI KHOẢN
========================================= */

function updateUserEmployerStatus(employer, status, reason = "") {
    const users = readStorage(USER_KEY, []);

    if (!Array.isArray(users)) return;

    let changed = false;

    users.forEach(user => {
        if (!user) return;

        const sameEmail =
            String(user.email || "").trim().toLowerCase() ===
            String(employer.email || "").trim().toLowerCase();

        const sameId =
            employer.userId != null &&
            String(user.id) === String(employer.userId);

        if (!sameEmail && !sameId) return;

        user.status = status;
        user.approvalStatus = status;

        if (status === "rejected") {
            user.reason = reason;
            user.rejectionReason = reason;
        } else {
            delete user.reason;
            delete user.rejectionReason;
        }

        changed = true;
    });

    if (changed) {
        writeStorage(USER_KEY, users);
    }
}

/* =========================================
   6. THỐNG KÊ
========================================= */

function updateStatistics() {
    const pendingEmployers =
        employers.filter(item => item.status === "pending").length;

    const pendingJobs =
        jobs.filter(item => item.status === "pending").length;

    const values = {
        "total-employers": employers.length,
        "pending-employers": pendingEmployers,
        "total-jobs": jobs.length,
        "pending-jobs": pendingJobs,
        "employer-count": pendingEmployers,
        "job-count": pendingJobs
    };

    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const employerOverview =
        document.getElementById("overview-employer-count");

    const jobOverview =
        document.getElementById("overview-job-count");

    if (employerOverview) {
        employerOverview.textContent =
            `${pendingEmployers} yêu cầu đang chờ`;
    }

    if (jobOverview) {
        jobOverview.textContent =
            `${pendingJobs} tin đang chờ`;
    }
}

/* =========================================
   7. HIỂN THỊ DOANH NGHIỆP
========================================= */

function renderEmployers() {
    const tbody = document.getElementById("employer-table-body");
    if (!tbody) return;

    const keyword = (
        document.getElementById("employer-search")?.value || ""
    ).trim().toLowerCase();

    const filter =
        document.getElementById("employer-filter")?.value || "all";

    const filtered = employers.filter(item => {
        const name = String(item.name || "").toLowerCase();
        const email = String(item.email || "").toLowerCase();

        return (
            (name.includes(keyword) || email.includes(keyword)) &&
            (filter === "all" || item.status === filter)
        );
    });

    tbody.innerHTML = filtered.map(item => {
        const canApprove = item.status !== "approved";
        const canReject = item.status !== "rejected";

        return `
            <tr>
                <td><strong>${escapeHTML(item.name)}</strong></td>
                <td>${escapeHTML(item.email)}</td>
                <td>${escapeHTML(item.date)}</td>
                <td>
                    ${getStatusBadge(item.status)}
                    ${
                        item.reason
                            ? `<small class="rejection-reason">Lý do: ${escapeHTML(item.reason)}</small>`
                            : ""
                    }
                </td>
                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-btn approve-btn"
                            data-type="employer"
                            data-id="${escapeHTML(item.id)}"
                            data-action="approved"
                            ${canApprove ? "" : "disabled"}
                        >
                            ${item.status === "rejected" ? "Duyệt lại" : "Duyệt"}
                        </button>

                        <button
                            type="button"
                            class="action-btn reject-btn"
                            data-type="employer"
                            data-id="${escapeHTML(item.id)}"
                            data-action="rejected"
                            ${canReject ? "" : "disabled"}
                        >
                            Từ chối
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    const empty = document.getElementById("employer-empty");
    if (empty) empty.hidden = filtered.length !== 0;
}

/* =========================================
   8. HIỂN THỊ TIN TUYỂN DỤNG
========================================= */

function renderJobs() {
    const tbody = document.getElementById("job-table-body");
    if (!tbody) return;

    const keyword = (
        document.getElementById("job-search")?.value || ""
    ).trim().toLowerCase();

    const filter =
        document.getElementById("job-filter")?.value || "all";

    const filtered = jobs.filter(item => {
        const title = String(item.title || "").toLowerCase();
        const company = String(item.company || "").toLowerCase();

        return (
            (title.includes(keyword) || company.includes(keyword)) &&
            (filter === "all" || item.status === filter)
        );
    });

    tbody.innerHTML = filtered.map(item => {
        const canApprove = item.status !== "approved";
        const canReject = item.status !== "rejected";

        return `
            <tr>
                <td><strong>${escapeHTML(item.title)}</strong></td>
                <td>${escapeHTML(item.company)}</td>
                <td>${escapeHTML(item.salary)}</td>
                <td>${getStatusBadge(item.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button
                            type="button"
                            class="action-btn approve-btn"
                            data-type="job"
                            data-id="${escapeHTML(item.id)}"
                            data-action="approved"
                            ${canApprove ? "" : "disabled"}
                        >
                            ${item.status === "rejected" ? "Duyệt lại" : "Duyệt"}
                        </button>

                        <button
                            type="button"
                            class="action-btn reject-btn"
                            data-type="job"
                            data-id="${escapeHTML(item.id)}"
                            data-action="rejected"
                            ${canReject ? "" : "disabled"}
                        >
                            Từ chối
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    const empty = document.getElementById("job-empty");
    if (empty) empty.hidden = filtered.length !== 0;
}

/* =========================================
   9. DUYỆT / TỪ CHỐI
========================================= */

function handleModeration(event) {
    const button = event.target.closest("button[data-action]");

    if (!button || button.disabled) return;

    const type = button.dataset.type;
    const id = button.dataset.id;
    const action = button.dataset.action;

    if (!["employer", "job"].includes(type)) return;
    if (!["approved", "rejected"].includes(action)) return;

    const list = type === "employer" ? employers : jobs;

    const item = list.find(record =>
        String(record.id) === String(id)
    );

    if (!item) {
        showToast("Không tìm thấy dữ liệu!", "error");
        return;
    }

    if (item.status === action) {
        showToast(
            action === "approved"
                ? "Doanh nghiệp đã được duyệt trước đó!"
                : "Mục này đã bị từ chối trước đó!",
            "warning"
        );
        return;
    }

    let reason = "";

    if (action === "rejected") {
        reason = window.prompt(
            "Nhập lý do từ chối (có thể để trống):",
            ""
        );

        if (reason === null) return;

        reason = reason.trim();
    }

    const previousStatus = item.status;
    const previousReason = item.reason;

    item.status = action;

    if (action === "rejected") {
        item.reason = reason;
    } else {
        item.reason = "";
    }

    const key = type === "employer" ? EMPLOYER_KEY : JOB_KEY;

    if (!writeStorage(key, list)) {
        item.status = previousStatus;
        item.reason = previousReason;
        return;
    }

    if (type === "employer") {
        updateUserEmployerStatus(item, action, reason);
    }

    renderEmployers();
    renderJobs();
    updateStatistics();

    if (action === "approved") {
        showToast("Duyệt thành công!", "success");
    } else {
        showToast("Đã từ chối!", "warning");
    }
}

/* =========================================
   10. CHUYỂN MỤC QUẢN TRỊ
========================================= */

function switchSection(sectionId) {
    const target = document.getElementById(sectionId);

    if (!target || !target.classList.contains("admin-section")) {
        showToast("Không tìm thấy mục quản trị!", "error");
        return;
    }

    document.querySelectorAll(".admin-section").forEach(section => {
        section.classList.remove("active");
    });

    document.querySelectorAll(".nav-item[data-section]").forEach(item => {
        item.classList.remove("active");
    });

    target.classList.add("active");

    const navItem = document.querySelector(
        `.nav-item[data-section="${sectionId}"]`
    );

    if (navItem) navItem.classList.add("active");

    const titles = {
        overview: "Tổng quan hệ thống",
        employers: "Phê duyệt doanh nghiệp",
        jobs: "Kiểm duyệt tin tuyển dụng",
        settings: "Cài đặt hệ thống"
    };

    const pageTitle = document.getElementById("page-title");

    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || "Quản trị hệ thống";
    }

    if (sectionId === "settings") loadSettings();

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* =========================================
   11. CÀI ĐẶT
========================================= */

function loadSettings() {
    const systemName = document.getElementById("system-name");
    const adminEmail = document.getElementById("admin-email");
    const description = document.getElementById("system-description");
    const approveEmployer = document.getElementById("approve-employer");
    const approveJob = document.getElementById("approve-job");

    if (systemName) systemName.value = settings.systemName || "";
    if (adminEmail) adminEmail.value = settings.adminEmail || "";
    if (description) description.value = settings.description || "";

    if (approveEmployer) {
        approveEmployer.checked = settings.approveEmployer !== false;
    }

    if (approveJob) {
        approveJob.checked = settings.approveJob !== false;
    }

    updateSystemInfo();
}

function saveSettings() {
    const systemName =
        document.getElementById("system-name")?.value.trim() || "";

    const adminEmail =
        document.getElementById("admin-email")?.value.trim() || "";

    const description =
        document.getElementById("system-description")?.value.trim() || "";

    const approveEmployer =
        document.getElementById("approve-employer")?.checked ?? true;

    const approveJob =
        document.getElementById("approve-job")?.checked ?? true;

    if (!systemName) {
        showToast("Vui lòng nhập tên hệ thống!", "error");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        showToast("Email quản trị viên không hợp lệ!", "error");
        return;
    }

    settings = {
        systemName,
        adminEmail,
        description,
        approveEmployer,
        approveJob
    };

    if (!writeStorage(SETTINGS_KEY, settings)) return;

    updateSystemInfo();
    showToast("Lưu cài đặt thành công!");
}

function updateSystemInfo() {
    const info = document.querySelector(".system-info > div strong");

    if (info) {
        info.textContent = settings.systemName || "JobPortal";
    }
}

function saveModerationSettings() {
    settings = {
        ...settings,
        approveEmployer:
            document.getElementById("approve-employer")?.checked ?? true,
        approveJob:
            document.getElementById("approve-job")?.checked ?? true
    };

    if (writeStorage(SETTINGS_KEY, settings)) {
        showToast("Đã cập nhật cấu hình kiểm duyệt!");
    }
}

/* =========================================
   12. KHỞI ĐỘNG
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    // Đồng bộ tài khoản nhà tuyển dụng đã đăng ký.
    syncRegisteredEmployers();

    // Điều hướng các mục quản trị.
    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", function () {
            switchSection(this.dataset.section);
        });
    });

    // Tìm kiếm doanh nghiệp.
    document.getElementById("employer-search")
        ?.addEventListener("input", renderEmployers);

    document.getElementById("employer-filter")
        ?.addEventListener("change", renderEmployers);

    // Tìm kiếm việc làm.
    document.getElementById("job-search")
        ?.addEventListener("input", renderJobs);

    document.getElementById("job-filter")
        ?.addEventListener("change", renderJobs);

    // Ủy quyền sự kiện: hoạt động cả khi bảng được render lại.
    document.querySelector(".admin-main")
        ?.addEventListener("click", handleModeration);

    // Lưu cài đặt.
    document.getElementById("save-settings")
        ?.addEventListener("click", saveSettings);

    document.getElementById("approve-employer")
        ?.addEventListener("change", saveModerationSettings);

    document.getElementById("approve-job")
        ?.addEventListener("change", saveModerationSettings);

    // Tải dữ liệu giao diện.
    loadSettings();
    renderEmployers();
    renderJobs();
    updateStatistics();

    console.log("JobPortal Admin đã khởi động thành công!");
});
