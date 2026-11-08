
/* =========================================
   JOBPORTAL - ADMIN MANAGEMENT
   Quản lý tổng quan, doanh nghiệp, việc làm
   và cài đặt hệ thống
========================================= */


/* =========================================
   1. DỮ LIỆU DEMO
========================================= */

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
   2. HÀM LÀM VIỆC VỚI LOCAL STORAGE
========================================= */

function loadData(key, defaultValue) {
    try {
        const saved = localStorage.getItem(key);

        if (saved === null) {
            return JSON.parse(JSON.stringify(defaultValue));
        }

        return JSON.parse(saved);
    } catch (error) {
        console.error("Lỗi đọc dữ liệu:", error);
        return JSON.parse(JSON.stringify(defaultValue));
    }
}

function saveData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Lỗi lưu dữ liệu:", error);
        showToast("Không thể lưu dữ liệu!", "error");
        return false;
    }
}

let employers = loadData("jobportal_employers", DEFAULT_EMPLOYERS);
let jobs = loadData("jobportal_jobs", DEFAULT_JOBS);
let settings = loadData("jobportal_settings", DEFAULT_SETTINGS);


/* =========================================
   3. THÔNG BÁO TOAST
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

    const background = type === "error"
        ? "#dc2626"
        : type === "warning"
            ? "#d97706"
            : "#16a34a";

    Object.assign(toast.style, {
        background: background,
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
   4. HÀM HỖ TRỢ
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
    const labels = {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Đã từ chối"
    };

    return labels[status] || status;
}

function getStatusBadge(status) {
    return `
        <span class="status-badge status-${escapeHTML(status)}">
            ${escapeHTML(getStatusText(status))}
        </span>
    `;
}


/* =========================================
   5. CẬP NHẬT THỐNG KÊ
========================================= */

function updateStatistics() {
    const pendingEmployers =
        employers.filter(item => item.status === "pending").length;

    const pendingJobs =
        jobs.filter(item => item.status === "pending").length;

    const statistics = {
        "total-employers": employers.length,
        "pending-employers": pendingEmployers,
        "total-jobs": jobs.length,
        "pending-jobs": pendingJobs,
        "employer-count": pendingEmployers,
        "job-count": pendingJobs
    };

    Object.entries(statistics).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
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
   6. HIỂN THỊ DOANH NGHIỆP
========================================= */

function renderEmployers() {
    const tbody = document.getElementById("employer-table-body");

    if (!tbody) return;

    const searchInput = document.getElementById("employer-search");
    const filterInput = document.getElementById("employer-filter");

    const keyword = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filter = filterInput ? filterInput.value : "all";

    const filtered = employers.filter(item => {
        const matchesKeyword =
            item.name.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword);

        const matchesStatus =
            filter === "all" || item.status === filter;

        return matchesKeyword && matchesStatus;
    });

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td><strong>${escapeHTML(item.name)}</strong></td>

            <td>${escapeHTML(item.email)}</td>

            <td>${escapeHTML(item.date)}</td>

            <td>${getStatusBadge(item.status)}</td>

            <td>
                <div class="action-buttons">

                    <button
                        class="action-btn approve-btn"
                        data-type="employer"
                        data-id="${item.id}"
                        data-action="approved"
                        ${item.status !== "pending" ? "disabled" : ""}
                    >
                        Duyệt
                    </button>

                    <button
                        class="action-btn reject-btn"
                        data-type="employer"
                        data-id="${item.id}"
                        data-action="rejected"
                        ${item.status !== "pending" ? "disabled" : ""}
                    >
                        Từ chối
                    </button>

                </div>
            </td>
        </tr>
    `).join("");

    const empty = document.getElementById("employer-empty");

    if (empty) {
        empty.hidden = filtered.length !== 0;
    }
}


/* =========================================
   7. HIỂN THỊ TIN TUYỂN DỤNG
========================================= */

function renderJobs() {
    const tbody = document.getElementById("job-table-body");

    if (!tbody) return;

    const searchInput = document.getElementById("job-search");
    const filterInput = document.getElementById("job-filter");

    const keyword = searchInput
        ? searchInput.value.toLowerCase().trim()
        : "";

    const filter = filterInput ? filterInput.value : "all";

    const filtered = jobs.filter(item => {
        const matchesKeyword =
            item.title.toLowerCase().includes(keyword) ||
            item.company.toLowerCase().includes(keyword);

        const matchesStatus =
            filter === "all" || item.status === filter;

        return matchesKeyword && matchesStatus;
    });

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td><strong>${escapeHTML(item.title)}</strong></td>

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
                        ${item.status !== "pending" ? "disabled" : ""}
                    >
                        Duyệt
                    </button>

                    <button
                        class="action-btn reject-btn"
                        data-type="job"
                        data-id="${item.id}"
                        data-action="rejected"
                        ${item.status !== "pending" ? "disabled" : ""}
                    >
                        Từ chối
                    </button>

                </div>
            </td>
        </tr>
    `).join("");

    const empty = document.getElementById("job-empty");

    if (empty) {
        empty.hidden = filtered.length !== 0;
    }
}


/* =========================================
   8. CHUYỂN ĐỔI GIAO DIỆN
========================================= */

function switchSection(sectionId) {
    const target = document.getElementById(sectionId);

    if (!target || !target.classList.contains("admin-section")) {
        showToast("Không tìm thấy giao diện được yêu cầu!", "error");
        return;
    }

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

    const titles = {
        overview: "Tổng quan hệ thống",
        employers: "Phê duyệt doanh nghiệp",
        jobs: "Kiểm duyệt tin tuyển dụng",
        settings: "Cài đặt hệ thống"
    };

    const pageTitle = document.getElementById("page-title");

    if (pageTitle) {
        pageTitle.textContent =
            titles[sectionId] || "Quản trị hệ thống";
    }

    if (sectionId === "settings") {
        loadSettings();
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================
   9. XỬ LÝ DUYỆT / TỪ CHỐI
========================================= */

function handleModeration(event) {
    const button = event.target.closest("[data-action]");

    if (!button || button.disabled) return;

    const type = button.dataset.type;
    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (!["employer", "job"].includes(type)) return;

    if (!["approved", "rejected"].includes(action)) return;

    const list = type === "employer" ? employers : jobs;

    const item = list.find(record => record.id === id);

    if (!item || item.status !== "pending") return;

    const itemName = item.name || item.title;

    const actionText =
        action === "approved" ? "duyệt" : "từ chối";

    const confirmed = window.confirm(
        `Bạn có chắc chắn muốn ${actionText} "${itemName}" không?`
    );

    if (!confirmed) return;

    item.status = action;

    const storageKey =
        type === "employer"
            ? "jobportal_employers"
            : "jobportal_jobs";

    if (!saveData(storageKey, list)) {
        item.status = "pending";
        return;
    }

    renderEmployers();
    renderJobs();
    updateStatistics();

    showToast(
        action === "approved"
            ? "Đã duyệt thành công!"
            : "Đã từ chối yêu cầu!",
        "success"
    );
}


/* =========================================
   10. CÀI ĐẶT HỆ THỐNG
========================================= */

// Hiển thị dữ liệu đã lưu lên giao diện

function loadSettings() {
    const systemName = document.getElementById("system-name");
    const adminEmail = document.getElementById("admin-email");
    const description = document.getElementById("system-description");

    const approveEmployer =
        document.getElementById("approve-employer");

    const approveJob =
        document.getElementById("approve-job");

    if (systemName) {
        systemName.value = settings.systemName;
    }

    if (adminEmail) {
        adminEmail.value = settings.adminEmail;
    }

    if (description) {
        description.value = settings.description;
    }

    if (approveEmployer) {
        approveEmployer.checked = settings.approveEmployer;
    }

    if (approveJob) {
        approveJob.checked = settings.approveJob;
    }

    updateSystemInfo();
}


// Lưu thông tin chung

function saveSettings() {
    const systemName =
        document.getElementById("system-name").value.trim();

    const adminEmail =
        document.getElementById("admin-email").value.trim();

    const description =
        document.getElementById("system-description").value.trim();

    const approveEmployer =
        document.getElementById("approve-employer").checked;

    const approveJob =
        document.getElementById("approve-job").checked;

    if (!systemName) {
        showToast("Vui lòng nhập tên hệ thống!", "error");
        return;
    }

    if (!adminEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
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

    if (!saveData("jobportal_settings", settings)) return;

    updateSystemInfo();

    showToast("Lưu cài đặt thành công!", "success");
}


// Cập nhật thông tin hệ thống

function updateSystemInfo() {
    const info = document.querySelectorAll(".system-info > div");

    if (info.length >= 1) {
        info[0].querySelector("strong").textContent =
            settings.systemName;
    }
}


// Lưu cấu hình kiểm duyệt khi bật / tắt

function saveModerationSettings() {
    const approveEmployer =
        document.getElementById("approve-employer").checked;

    const approveJob =
        document.getElementById("approve-job").checked;

    settings = {
        ...settings,
        approveEmployer,
        approveJob
    };

    if (saveData("jobportal_settings", settings)) {
        showToast("Đã cập nhật cấu hình kiểm duyệt!");
    }
}


/* =========================================
   11. KHỞI TẠO HỆ THỐNG
========================================= */

document.addEventListener("DOMContentLoaded", function () {

    // Chuyển trang quản trị

    document.querySelectorAll("[data-section]").forEach(button => {
        button.addEventListener("click", function () {
            switchSection(this.dataset.section);
        });
    });


    // Tìm kiếm doanh nghiệp

    const employerSearch =
        document.getElementById("employer-search");

    const employerFilter =
        document.getElementById("employer-filter");

    if (employerSearch) {
        employerSearch.addEventListener("input", renderEmployers);
    }

    if (employerFilter) {
        employerFilter.addEventListener("change", renderEmployers);
    }


    // Tìm kiếm tin tuyển dụng

    const jobSearch = document.getElementById("job-search");
    const jobFilter = document.getElementById("job-filter");

    if (jobSearch) {
        jobSearch.addEventListener("input", renderJobs);
    }

    if (jobFilter) {
        jobFilter.addEventListener("change", renderJobs);
    }


    // Xử lý duyệt và từ chối

    const adminMain = document.querySelector(".admin-main");

    if (adminMain) {
        adminMain.addEventListener("click", handleModeration);
    }


    // Nút lưu cài đặt

    const saveButton =
        document.getElementById("save-settings");

    if (saveButton) {
        saveButton.addEventListener("click", saveSettings);
    }


    // Cấu hình kiểm duyệt

    const approveEmployer =
        document.getElementById("approve-employer");

    const approveJob =
        document.getElementById("approve-job");

    if (approveEmployer) {
        approveEmployer.addEventListener(
            "change",
            saveModerationSettings
        );
    }

    if (approveJob) {
        approveJob.addEventListener(
            "change",
            saveModerationSettings
        );
    }


    // Tải cài đặt đã lưu

    loadSettings();


    // Hiển thị dữ liệu ban đầu

    renderEmployers();
    renderJobs();
    updateStatistics();


    console.log("JobPortal Admin đã khởi động thành công!");

});
