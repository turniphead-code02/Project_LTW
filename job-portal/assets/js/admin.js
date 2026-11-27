/* =========================================
   JOBPORTAL - ADMIN CONSOLE v2.0
   Đồng bộ Shared API Client & Modals chuyên nghiệp
========================================= */

const API = window.JobPortalAPI;

let state = {
    employers: [],
    candidates: [],
    jobs: [],
    categories: [],
    totalApplications: 0,
    settings: {}
};

let pendingRejectJobId = null;
let pendingConfirmAction = null;

const SECTION_META = {
    overview: {
        title: "Tổng quan hệ thống",
        subtitle: "Giám sát người dùng, kiểm duyệt nội dung tin tuyển dụng và dọn dẹp dữ liệu hết hạn."
    },
    employers: {
        title: "Quản lý Doanh nghiệp",
        subtitle: "Kiểm tra hồ sơ công ty, số lượng tin đăng và kiểm soát trạng thái tài khoản HR."
    },
    candidates: {
        title: "Quản lý Ứng viên",
        subtitle: "Theo dõi danh sách tài khoản tìm việc, số lượng CV và lượt ứng tuyển."
    },
    jobs: {
        title: "Kiểm duyệt & Quản lý Tin tuyển dụng",
        subtitle: "Xem chi tiết nội dung trước khi duyệt, đóng tin vi phạm hoặc xóa tin đăng lâu ngày / quá hạn."
    },
    categories: {
        title: "Quản lý Ngành nghề",
        subtitle: "Thêm mới hoặc xóa danh mục ngành nghề chưa có tin tuyển dụng gắn kết."
    },
    settings: {
        title: "Cài đặt hệ thống",
        subtitle: "Cấu hình thông tin chung và quy trình kiểm duyệt được lưu trực tiếp trong cơ sở dữ liệu."
    }
};

/* =========================================
   1. TOAST & HÀM HỖ TRỢ
========================================= */

function showToast(message, type = "success") {
    let container = document.getElementById("admin-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "admin-toast-container";
        Object.assign(container.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: "99999",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
        });
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    const background =
        type === "error" ? "#DC2626" :
        type === "warning" ? "#D97706" :
        "#16A34A";

    Object.assign(toast.style, {
        background,
        color: "#FFFFFF",
        padding: "13px 18px",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: "600",
        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.2)",
        opacity: "0",
        transform: "translateY(-8px)",
        transition: "all 0.22s ease"
    });

    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-8px)";
        setTimeout(() => toast.remove(), 250);
    }, 3200);
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

function formatDateVN(raw) {
    if (!raw) return "Chưa có";
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(raw));
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? escapeHTML(raw) : d.toLocaleDateString("vi-VN");
}

function formatAdminSalary(minRaw, maxRaw, currency = "VND") {
    const min = Number(minRaw);
    const max = Number(maxRaw);
    if (currency === "USD" && (min > 0 || max > 0)) {
        if (min > 0 && max > 0) return `$${min.toLocaleString("en-US")} - $${max.toLocaleString("en-US")}`;
        return min > 0 ? `Từ $${min.toLocaleString("en-US")}` : `Đến $${max.toLocaleString("en-US")}`;
    }

    const toTrieu = v => {
        const val = v >= 100000 ? v / 1e6 : v;
        return Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, "");
    };

    if (min > 0 && max > 0) return `${toTrieu(min)} - ${toTrieu(max)} triệu`;
    if (min > 0) return `Từ ${toTrieu(min)} triệu`;
    if (max > 0) return `Đến ${toTrieu(max)} triệu`;
    return "Thỏa thuận";
}

function formatEmploymentType(type) {
    const map = {
        full_time: "Toàn thời gian",
        part_time: "Bán thời gian",
        internship: "Thực tập",
        remote: "Làm việc từ xa"
    };
    return map[type] || type || "Toàn thời gian";
}

function formatExperience(level) {
    const map = {
        intern: "Thực tập sinh",
        fresher: "Mới tốt nghiệp (Fresher)",
        junior: "Junior (1-2 năm)",
        middle: "Middle (2-4 năm)",
        senior: "Senior (4+ năm)",
        lead: "Trưởng nhóm / Quản lý"
    };
    return map[level] || level || "Không yêu cầu";
}

function getStatusBadge(status) {
    const labels = {
        pending: "Chờ duyệt",
        approved: "Đã duyệt",
        rejected: "Đã từ chối",
        closed: "Đã đóng",
        active: "Hoạt động",
        locked: "Đã khóa"
    };
    return `<span class="status-badge status-${escapeHTML(status)}">${escapeHTML(labels[status] || status)}</span>`;
}

/* =========================================
   2. KIỂM TRA PHIÊN & HYDRATE PROFILE
========================================= */

function checkAdminSession() {
    const token = localStorage.getItem("jobportal_access_token");
    let session = null;

    try {
        session = JSON.parse(localStorage.getItem("jobportal_session") || "null");
    } catch (_) {}

    if (!token || !session) {
        window.location.replace("./auth.html?mode=login");
        return false;
    }

    if (session.role !== "admin") {
        window.location.replace("./index.html");
        return false;
    }

    if (!API) {
        showToast("Không tải được API Client (api.js).", "error");
        return false;
    }

    const adminName = session.fullName || session.name || session.full_name || "Administrator";
    const initial = adminName.trim().charAt(0).toUpperCase() || "A";

    const sidebarNameEl = document.getElementById("admin-sidebar-name");
    const sidebarAvatarEl = document.getElementById("admin-sidebar-avatar");
    const topbarAvatarEl = document.getElementById("admin-topbar-avatar");

    if (sidebarNameEl) sidebarNameEl.textContent = adminName;
    if (sidebarAvatarEl) sidebarAvatarEl.textContent = initial;
    if (topbarAvatarEl) {
        topbarAvatarEl.textContent = initial;
        topbarAvatarEl.title = adminName;
    }

    return true;
}

function handleApiError(error) {
    console.error("Admin API Error:", error);
    const code = Number(error?.code);

    if (code === 401) {
        API.clearAuthSession();
        window.location.replace("./auth.html?mode=login");
        return;
    }
    if (code === 403) {
        showToast("Tài khoản không có quyền thực hiện thao tác này.", "error");
        return;
    }
    showToast(error?.message || "Đã xảy ra lỗi khi xử lý yêu cầu.", "error");
}

/* =========================================
   3. QUẢN LÝ MODAL (KHÔNG DÙNG ALERT/CONFIRM/PROMPT)
========================================= */

function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.hidden = true;
}

function closeAllModals() {
    document.querySelectorAll(".admin-modal").forEach(m => { m.hidden = true; });
}

function openConfirmDialog({ title, message, okLabel = "Xác nhận", danger = true, onConfirm }) {
    const titleEl = document.getElementById("confirm-modal-title");
    const msgEl = document.getElementById("confirm-modal-message");
    const okBtn = document.getElementById("confirm-modal-ok");

    if (titleEl) titleEl.textContent = title || "Xác nhận thao tác";
    if (msgEl) msgEl.textContent = message || "";
    if (okBtn) {
        okBtn.textContent = okLabel;
        okBtn.className = danger ? "btn-modal-danger" : "btn-modal-primary";
    }

    pendingConfirmAction = onConfirm;
    openModal("confirm-modal");
}

/* =========================================
   4. TẢI DỮ LIỆU TỔNG QUAN TỪ DATABASE
========================================= */

async function fetchAdminOverview(showRefreshToast = false) {
    try {
        const result = await API.get("/admin/overview");
        if (!result || !result.success || !result.data) {
            throw new Error(result?.message || "Không thể tải dữ liệu quản trị.");
        }

        const data = result.data;

        state.employers = (data.employers || []).map(emp => ({
            companyId: emp.company_id,
            userId: emp.user_id,
            companyName: emp.company_name || "Chưa có tên công ty",
            fullName: emp.full_name || "HR",
            email: emp.email || "",
            phone: emp.phone || "",
            taxCode: emp.tax_code || "",
            website: emp.website || "",
            jobCount: Number(emp.job_count || 0),
            createdAt: formatDateVN(emp.created_at),
            status: emp.user_status === "locked" ? "locked" : "active"
        }));

        state.candidates = (data.candidates || []).map(c => ({
            userId: c.user_id,
            fullName: c.full_name || "Ứng viên",
            email: c.email || "",
            phone: c.phone || "Chưa cập nhật",
            resumeCount: Number(c.resume_count || 0),
            applicationCount: Number(c.application_count || 0),
            createdAt: formatDateVN(c.created_at),
            status: c.user_status === "locked" ? "locked" : "active"
        }));

        state.jobs = (data.jobs || []).map(job => ({
            id: job.job_id,
            title: job.title || "Chưa có tiêu đề",
            company: job.company_name || "Chưa có doanh nghiệp",
            categoryName: job.category_name || "Khác",
            locationName: job.location_name || "Toàn quốc",
            salary: formatAdminSalary(job.salary_min, job.salary_max, job.currency),
            employmentType: formatEmploymentType(job.employment_type),
            experienceLevel: formatExperience(job.experience_level),
            description: job.description || "",
            requirements: job.requirements || "",
            benefits: job.benefits || "",
            deadlineRaw: job.deadline || "",
            deadlineText: formatDateVN(job.deadline),
            createdAtText: formatDateVN(job.created_at),
            ageDays: Math.max(0, Number(job.age_days || 0)),
            isExpired: Boolean(Number(job.is_expired)),
            status: job.status || "pending",
            rejectReason: job.reject_reason || "",
            applicationCount: Number(job.application_count || 0)
        }));

        state.categories = (data.categories || []).map(cat => ({
            id: cat.category_id,
            name: cat.category_name,
            slug: cat.slug,
            description: cat.description || "",
            jobCount: Number(cat.job_count || 0)
        }));

        state.totalApplications = Number(data.totalApplications || 0);
        state.settings = data.settings || {};

        applySettingsToUI();
        updateStatistics();
        renderOverviewWidgets();
        renderEmployers();
        renderCandidates();
        renderJobs();
        renderCategories();

        if (showRefreshToast) {
            showToast("Đã làm mới dữ liệu từ cơ sở dữ liệu.");
        }
    } catch (error) {
        handleApiError(error);
    }
}

/* =========================================
   5. THỐNG KÊ & BIỂU ĐỒ TỔNG QUAN
========================================= */

function getStaleJobsCount() {
    return state.jobs.filter(j => j.isExpired || j.ageDays >= 30).length;
}

function updateStatistics() {
    const lockedEmployers = state.employers.filter(e => e.status === "locked").length;
    const lockedCandidates = state.candidates.filter(c => c.status === "locked").length;
    const pendingJobs = state.jobs.filter(j => j.status === "pending").length;
    const approvedJobs = state.jobs.filter(j => j.status === "approved").length;
    const staleJobs = getStaleJobsCount();

    const mapText = {
        "total-employers": state.employers.length,
        "total-candidates": state.candidates.length,
        "pending-jobs": pendingJobs,
        "total-applications": state.totalApplications,
        "employer-count": state.employers.length,
        "candidate-count": state.candidates.length,
        "job-count": pendingJobs,
        "category-count": state.categories.length,
        "locked-employers-tag": `${lockedEmployers} bị khóa`,
        "locked-candidates-tag": `${lockedCandidates} bị khóa`,
        "expired-jobs-tag": `${staleJobs} hết hạn / ≥30d`,
        "approved-jobs-tag": `${approvedJobs} đang duyệt`,
        "total-jobs-sub": `Tổng ${state.jobs.length} tin trên sàn`,
        "overview-job-count": `${pendingJobs} tin đang chờ duyệt`,
        "overview-stale-count": `${staleJobs} tin quá hạn hoặc đăng ≥ 30 ngày`
    };

    Object.entries(mapText).forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    });
}

function renderOverviewWidgets() {
    const statusBox = document.getElementById("job-status-breakdown");
    const total = state.jobs.length || 1;

    if (statusBox) {
        const rows = [
            { label: "Đang hiển thị (Đã duyệt)", count: state.jobs.filter(j => j.status === "approved").length, color: "#16A34A" },
            { label: "Đang chờ kiểm duyệt", count: state.jobs.filter(j => j.status === "pending").length, color: "#D97706" },
            { label: "Đã đóng / Từ chối", count: state.jobs.filter(j => j.status === "closed" || j.status === "rejected").length, color: "#64748B" },
            { label: "Đã quá hạn nộp hồ sơ", count: state.jobs.filter(j => j.isExpired).length, color: "#DC2626" }
        ];

        statusBox.innerHTML = rows.map(r => {
            const pct = Math.round((r.count / total) * 100);
            return `
                <div class="breakdown-row">
                    <div class="breakdown-top">
                        <span>${escapeHTML(r.label)}</span>
                        <span>${r.count} tin (${pct}%)</span>
                    </div>
                    <div class="breakdown-track">
                        <div class="breakdown-fill" style="width: ${pct}%; background: ${r.color};"></div>
                    </div>
                </div>
            `;
        }).join("");
    }

    const catBox = document.getElementById("top-categories-breakdown");
    if (catBox) {
        const topCats = [...state.categories]
            .sort((a, b) => b.jobCount - a.jobCount)
            .slice(0, 5);
        const maxCat = Math.max(1, ...topCats.map(c => c.jobCount));

        catBox.innerHTML = topCats.length
            ? topCats.map(c => {
                const pct = Math.round((c.jobCount / maxCat) * 100);
                return `
                    <div class="breakdown-row">
                        <div class="breakdown-top">
                            <span>${escapeHTML(c.name)}</span>
                            <span>${c.jobCount} tin</span>
                        </div>
                        <div class="breakdown-track">
                            <div class="breakdown-fill" style="width: ${pct}%; background: #2563EB;"></div>
                        </div>
                    </div>
                `;
            }).join("")
            : `<p class="empty-message">Chưa có dữ liệu ngành nghề.</p>`;
    }

    const pendingBody = document.getElementById("overview-pending-body");
    const pendingEmpty = document.getElementById("overview-pending-empty");
    if (pendingBody) {
        const pendingList = state.jobs.filter(j => j.status === "pending").slice(0, 5);
        if (pendingEmpty) pendingEmpty.hidden = pendingList.length > 0;
        pendingBody.innerHTML = pendingList.map(job => `
            <tr>
                <td>
                    <span class="cell-title">${escapeHTML(job.title)}</span>
                    <span class="cell-sub">${escapeHTML(job.categoryName)} • ${escapeHTML(job.locationName)}</span>
                </td>
                <td>${escapeHTML(job.company)}</td>
                <td>${escapeHTML(job.salary)}</td>
                <td>${escapeHTML(job.deadlineText)}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="action-btn view-btn" data-job-view="${job.id}">
                            <i class="fa-regular fa-eye"></i> Chi tiết
                        </button>
                        <button type="button" class="action-btn approve-btn" data-job-action="approved" data-id="${job.id}">
                            <i class="fa-solid fa-check"></i> Duyệt
                        </button>
                        <button type="button" class="action-btn reject-btn" data-job-action="rejected" data-id="${job.id}">
                            <i class="fa-solid fa-xmark"></i> Từ chối
                        </button>
                    </div>
                </td>
            </tr>
        `).join("");
    }
}

/* =========================================
   6. HIỂN THỊ DOANH NGHIỆP & ỨNG VIÊN
========================================= */

function renderEmployers() {
    const tbody = document.getElementById("employer-table-body");
    const emptyEl = document.getElementById("employer-empty");
    if (!tbody) return;

    const keyword = (document.getElementById("employer-search")?.value || "").toLowerCase().trim();
    const statusFilter = document.getElementById("employer-filter")?.value || "all";

    const filtered = state.employers.filter(item => {
        const matchKw =
            item.companyName.toLowerCase().includes(keyword) ||
            item.fullName.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword) ||
            item.taxCode.toLowerCase().includes(keyword);
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        return matchKw && matchStatus;
    });

    if (emptyEl) emptyEl.hidden = filtered.length > 0;

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <span class="cell-title">${escapeHTML(item.companyName)}</span>
                <span class="cell-sub">${item.taxCode ? `MST: ${escapeHTML(item.taxCode)}` : "Chưa cập nhật MST"}</span>
            </td>
            <td>
                <span class="cell-title">${escapeHTML(item.fullName)}</span>
                <span class="cell-sub">${escapeHTML(item.email)}</span>
            </td>
            <td><strong>${item.jobCount}</strong> tin</td>
            <td>${escapeHTML(item.createdAt)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="action-btn ${item.status === "locked" ? "approve-btn" : "reject-btn"}"
                        data-user-toggle="${item.userId}"
                        data-next-status="${item.status === "locked" ? "active" : "locked"}"
                        data-user-label="${escapeHTML(item.companyName)}">
                        <i class="fa-solid ${item.status === "locked" ? "fa-lock-open" : "fa-lock"}"></i>
                        ${item.status === "locked" ? "Mở khóa" : "Khóa"}
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function renderCandidates() {
    const tbody = document.getElementById("candidate-table-body");
    const emptyEl = document.getElementById("candidate-empty");
    if (!tbody) return;

    const keyword = (document.getElementById("candidate-search")?.value || "").toLowerCase().trim();
    const statusFilter = document.getElementById("candidate-filter")?.value || "all";

    const filtered = state.candidates.filter(item => {
        const matchKw =
            item.fullName.toLowerCase().includes(keyword) ||
            item.email.toLowerCase().includes(keyword) ||
            item.phone.toLowerCase().includes(keyword);
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        return matchKw && matchStatus;
    });

    if (emptyEl) emptyEl.hidden = filtered.length > 0;

    tbody.innerHTML = filtered.map(item => `
        <tr>
            <td>
                <span class="cell-title">${escapeHTML(item.fullName)}</span>
            </td>
            <td>
                <span class="cell-title">${escapeHTML(item.email)}</span>
                <span class="cell-sub">${escapeHTML(item.phone)}</span>
            </td>
            <td>
                <span>${item.resumeCount} CV</span> • <strong>${item.applicationCount}</strong> đơn
            </td>
            <td>${escapeHTML(item.createdAt)}</td>
            <td>${getStatusBadge(item.status)}</td>
            <td>
                <div class="action-buttons">
                    <button
                        type="button"
                        class="action-btn ${item.status === "locked" ? "approve-btn" : "reject-btn"}"
                        data-user-toggle="${item.userId}"
                        data-next-status="${item.status === "locked" ? "active" : "locked"}"
                        data-user-label="${escapeHTML(item.fullName)}">
                        <i class="fa-solid ${item.status === "locked" ? "fa-lock-open" : "fa-lock"}"></i>
                        ${item.status === "locked" ? "Mở khóa" : "Khóa"}
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

/* =========================================
   7. HIỂN THỊ TIN TUYỂN DỤNG & XÓA TIN CŨ
========================================= */

function matchesAgeFilter(job, ageFilter) {
    if (ageFilter === "expired") return job.isExpired;
    if (ageFilter === "old30") return job.ageDays >= 30;
    if (ageFilter === "old60") return job.ageDays >= 60;
    if (ageFilter === "old90") return job.ageDays >= 90;
    return true;
}

function renderJobs() {
    const tbody = document.getElementById("job-table-body");
    const emptyEl = document.getElementById("job-empty");
    if (!tbody) return;

    const keyword = (document.getElementById("job-search")?.value || "").toLowerCase().trim();
    const statusFilter = document.getElementById("job-filter")?.value || "all";
    const ageFilter = document.getElementById("job-age-filter")?.value || "all";

    const filtered = state.jobs.filter(item => {
        const matchKw =
            item.title.toLowerCase().includes(keyword) ||
            item.company.toLowerCase().includes(keyword) ||
            item.categoryName.toLowerCase().includes(keyword);
        const matchStatus = statusFilter === "all" || item.status === statusFilter;
        return matchKw && matchStatus && matchesAgeFilter(item, ageFilter);
    });

    if (emptyEl) emptyEl.hidden = filtered.length > 0;

    tbody.innerHTML = filtered.map(item => {
        const ageBadge = item.isExpired
            ? `<span class="age-pill expired"><i class="fa-solid fa-clock"></i> Quá hạn nộp</span>`
            : item.ageDays >= 30
                ? `<span class="age-pill stale"><i class="fa-regular fa-calendar"></i> Đăng ${item.ageDays} ngày</span>`
                : `<span class="age-pill fresh">Đăng ${item.ageDays} ngày</span>`;

        return `
            <tr>
                <td>
                    <span class="cell-title">${escapeHTML(item.title)}</span>
                    <span class="cell-sub">${escapeHTML(item.categoryName)} • ${escapeHTML(item.locationName)} • ${item.applicationCount} đơn</span>
                </td>
                <td>${escapeHTML(item.company)}</td>
                <td>${escapeHTML(item.salary)}</td>
                <td>
                    <span class="cell-sub" style="margin-top:0;">Hạn: <strong>${escapeHTML(item.deadlineText)}</strong></span>
                    ${ageBadge}
                </td>
                <td>${getStatusBadge(item.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="action-btn view-btn" data-job-view="${item.id}" title="Xem nội dung chi tiết">
                            <i class="fa-regular fa-eye"></i> Xem
                        </button>
                        <button type="button" class="action-btn approve-btn" data-job-action="approved" data-id="${item.id}" ${item.status === "approved" ? "disabled" : ""}>
                            <i class="fa-solid fa-check"></i> Duyệt
                        </button>
                        <button type="button" class="action-btn reject-btn" data-job-action="rejected" data-id="${item.id}" ${item.status === "rejected" ? "disabled" : ""}>
                            <i class="fa-solid fa-xmark"></i> Từ chối
                        </button>
                        <button type="button" class="action-btn close-btn" data-job-action="closed" data-id="${item.id}" ${item.status === "closed" ? "disabled" : ""} title="Đóng tin tuyển dụng">
                            <i class="fa-solid fa-box-archive"></i>
                        </button>
                        <button type="button" class="action-btn delete-btn" data-job-delete="${item.id}" title="Xóa vĩnh viễn tin này">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function openJobDetailModal(jobId) {
    const job = state.jobs.find(j => j.id === Number(jobId));
    if (!job) return;

    const titleEl = document.getElementById("jd-modal-title");
    const compEl = document.getElementById("jd-modal-company");
    const bodyEl = document.getElementById("jd-modal-body");
    const footerEl = document.getElementById("jd-modal-footer");

    if (compEl) compEl.textContent = job.company;
    if (titleEl) titleEl.textContent = job.title;

    if (bodyEl) {
        bodyEl.innerHTML = `
            <div class="jd-meta-grid">
                <div><span>Ngành nghề</span><strong>${escapeHTML(job.categoryName)}</strong></div>
                <div><span>Địa điểm</span><strong>${escapeHTML(job.locationName)}</strong></div>
                <div><span>Mức lương</span><strong>${escapeHTML(job.salary)}</strong></div>
                <div><span>Hình thức &amp; Cấp bậc</span><strong>${escapeHTML(job.employmentType)} • ${escapeHTML(job.experienceLevel)}</strong></div>
                <div><span>Ngày đăng / Hạn nộp</span><strong>${escapeHTML(job.createdAtText)} → ${escapeHTML(job.deadlineText)}</strong></div>
                <div><span>Trạng thái &amp; Ứng tuyển</span>${getStatusBadge(job.status)} <small style="margin-left:6px;color:#64748B;">(${job.applicationCount} đơn)</small></div>
            </div>
            ${job.rejectReason ? `<div class="jd-reject-alert"><strong>Lý do từ chối:</strong> ${escapeHTML(job.rejectReason)}</div>` : ""}
            <div class="jd-block">
                <h4>Mô tả công việc</h4>
                <p>${escapeHTML(job.description || "Không có mô tả.")}</p>
            </div>
            <div class="jd-block">
                <h4>Yêu cầu ứng viên</h4>
                <p>${escapeHTML(job.requirements || "Không có yêu cầu chi tiết.")}</p>
            </div>
            <div class="jd-block">
                <h4>Quyền lợi</h4>
                <p>${escapeHTML(job.benefits || "Theo chính sách công ty.")}</p>
            </div>
        `;
    }

    if (footerEl) {
        footerEl.innerHTML = `
            <button type="button" class="btn-modal-secondary" data-close-modal="job-detail-modal">Đóng</button>
            ${job.status !== "approved" ? `<button type="button" class="btn-modal-primary" data-modal-job-action="approved" data-id="${job.id}"><i class="fa-solid fa-check"></i> Duyệt tin</button>` : ""}
            ${job.status !== "rejected" ? `<button type="button" class="btn-modal-danger" data-modal-job-action="rejected" data-id="${job.id}"><i class="fa-solid fa-ban"></i> Từ chối</button>` : ""}
            <button type="button" class="btn-modal-danger" data-modal-job-delete="${job.id}"><i class="fa-solid fa-trash-can"></i> Xóa tin</button>
        `;
    }

    openModal("job-detail-modal");
}

/* =========================================
   8. DỌN DẸP TIN ĐĂNG LÂU NGÀY / QUÁ HẠN
========================================= */

function getMatchingCleanupJobs() {
    const mode = document.getElementById("cleanup-mode")?.value || "expired";
    const minDays = Number(document.getElementById("cleanup-days")?.value || 30);

    return state.jobs.filter(j => {
        if (mode === "expired") return j.isExpired;
        if (mode === "old") return j.ageDays >= minDays;
        if (mode === "closed_rejected") return j.status === "closed" || j.status === "rejected";
        return j.isExpired || j.ageDays >= minDays;
    });
}

function updateCleanupPreview() {
    const mode = document.getElementById("cleanup-mode")?.value || "expired";
    const daysGroup = document.getElementById("cleanup-days-group");
    const previewBox = document.getElementById("cleanup-preview-box");
    const confirmBtn = document.getElementById("confirm-cleanup-btn");

    if (daysGroup) {
        daysGroup.hidden = !(mode === "old" || mode === "expired_or_old");
    }

    const matches = getMatchingCleanupJobs();
    if (confirmBtn) confirmBtn.disabled = matches.length === 0;

    if (!previewBox) return;

    if (matches.length === 0) {
        previewBox.innerHTML = `<i class="fa-solid fa-circle-check"></i> Hiện không có tin tuyển dụng nào thỏa điều kiện này để xóa.`;
        return;
    }

    const sample = matches.slice(0, 5)
        .map(j => `<li><strong>${escapeHTML(j.title)}</strong> (${escapeHTML(j.company)} — hạn ${escapeHTML(j.deadlineText)})</li>`)
        .join("");

    previewBox.innerHTML = `
        <strong>Tìm thấy ${matches.length} tin tuyển dụng phù hợp để xóa vĩnh viễn:</strong>
        <ul>${sample}</ul>
        ${matches.length > 5 ? `<div style="margin-top:6px;">...và ${matches.length - 5} tin khác.</div>` : ""}
    `;
}

/* =========================================
   9. NGÀNH NGHỀ & CÀI ĐẶT HỆ THỐNG
========================================= */

function renderCategories() {
    const tbody = document.getElementById("category-table-body");
    if (!tbody) return;

    tbody.innerHTML = state.categories.map(cat => `
        <tr>
            <td><span class="cell-title">${escapeHTML(cat.name)}</span></td>
            <td><code>${escapeHTML(cat.slug)}</code></td>
            <td>${escapeHTML(cat.description || "—")}</td>
            <td><strong>${cat.jobCount}</strong> tin</td>
            <td>
                <button
                    type="button"
                    class="action-btn delete-btn"
                    data-cat-delete="${cat.id}"
                    data-cat-name="${escapeHTML(cat.name)}"
                    ${cat.jobCount > 0 ? "disabled title='Không thể xóa ngành nghề đang có tin tuyển dụng'" : ""}>
                    <i class="fa-solid fa-trash-can"></i> Xóa
                </button>
            </td>
        </tr>
    `).join("");
}

function applySettingsToUI() {
    const s = state.settings || {};
    const sysNameInput = document.getElementById("system-name");
    const adminEmailInput = document.getElementById("admin-email");
    const sysDescInput = document.getElementById("system-description");
    const approveEmpCheck = document.getElementById("approve-employer");
    const approveJobCheck = document.getElementById("approve-job");
    const brandNameEl = document.getElementById("sidebar-brand-name");
    const infoSysNameEl = document.getElementById("info-system-name");

    if (sysNameInput && s.site_name) sysNameInput.value = s.site_name;
    if (adminEmailInput && s.admin_email) adminEmailInput.value = s.admin_email;
    if (sysDescInput && s.site_description !== undefined) sysDescInput.value = s.site_description;
    if (approveEmpCheck) approveEmpCheck.checked = s.require_employer_approval === "1";
    if (approveJobCheck) approveJobCheck.checked = s.require_job_approval !== "0";
    if (brandNameEl && s.site_name) brandNameEl.textContent = s.site_name;
    if (infoSysNameEl && s.site_name) infoSysNameEl.textContent = s.site_name;
}

/* =========================================
   10. THỰC THI API THAO TÁC QUẢN TRỊ
========================================= */

async function updateJobStatus(jobId, status, rejectReason = null) {
    try {
        const res = await API.patch(`/admin/jobs/${jobId}/status`, {
            status,
            reject_reason: rejectReason
        });
        showToast(res.message || "Cập nhật tin tuyển dụng thành công.");
        await fetchAdminOverview();
    } catch (error) {
        handleApiError(error);
    }
}

async function deleteSingleJob(jobId) {
    try {
        const res = await API.delete(`/admin/jobs/${jobId}`);
        showToast(res.message || "Đã xóa tin tuyển dụng.");
        await fetchAdminOverview();
    } catch (error) {
        handleApiError(error);
    }
}

async function toggleUserStatus(userId, nextStatus) {
    try {
        const res = await API.patch(`/admin/users/${userId}/status`, { status: nextStatus });
        showToast(res.message || "Cập nhật trạng thái tài khoản thành công.");
        await fetchAdminOverview();
    } catch (error) {
        handleApiError(error);
    }
}

/* =========================================
   11. CHUYỂN TAB & KHỞI TẠO
========================================= */

function switchSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
    document.querySelectorAll(".nav-item[data-section]").forEach(n => n.classList.remove("active"));

    target.classList.add("active");
    const activeNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (activeNav) activeNav.classList.add("active");

    const titleEl = document.getElementById("page-title");
    const subtitleEl = document.getElementById("page-subtitle");
    const meta = SECTION_META[sectionId];
    if (meta) {
        if (titleEl) titleEl.textContent = meta.title;
        if (subtitleEl) subtitleEl.textContent = meta.subtitle;
    }

    document.getElementById("admin-sidebar")?.classList.remove("is-open");
    document.getElementById("admin-backdrop")?.classList.remove("is-open");
}

document.addEventListener("DOMContentLoaded", function () {
    if (!checkAdminSession()) return;

    // Mobile drawer
    const menuToggle = document.getElementById("admin-menu-toggle");
    const sidebar = document.getElementById("admin-sidebar");
    const backdrop = document.getElementById("admin-backdrop");

    if (menuToggle && sidebar && backdrop) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("is-open");
            backdrop.classList.toggle("is-open");
        });
        backdrop.addEventListener("click", () => {
            sidebar.classList.remove("is-open");
            backdrop.classList.remove("is-open");
        });
    }

    // Chuyển section
    document.querySelectorAll("[data-section]").forEach(btn => {
        btn.addEventListener("click", () => switchSection(btn.dataset.section));
    });

    // Làm mới
    document.getElementById("admin-refresh-btn")?.addEventListener("click", () => {
        fetchAdminOverview(true);
    });

    // Đăng xuất qua modal xác nhận
    document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
        openConfirmDialog({
            title: "Đăng xuất khỏi trang quản trị",
            message: "Bạn có chắc chắn muốn kết thúc phiên làm việc quản trị viên hiện tại?",
            okLabel: "Đăng xuất",
            danger: true,
            onConfirm: () => {
                API.clearAuthSession();
                showToast("Đã đăng xuất thành công.");
                setTimeout(() => window.location.replace("./auth.html?mode=login"), 250);
            }
        });
    });

    // Bộ lọc bảng
    document.getElementById("employer-search")?.addEventListener("input", renderEmployers);
    document.getElementById("employer-filter")?.addEventListener("change", renderEmployers);
    document.getElementById("candidate-search")?.addEventListener("input", renderCandidates);
    document.getElementById("candidate-filter")?.addEventListener("change", renderCandidates);
    document.getElementById("job-search")?.addEventListener("input", renderJobs);
    document.getElementById("job-filter")?.addEventListener("change", renderJobs);
    document.getElementById("job-age-filter")?.addEventListener("change", renderJobs);

    // Event delegation trên toàn trang cho bảng & modal
    document.body.addEventListener("click", function (e) {
        const closeTarget = e.target.closest("[data-close-modal]");
        if (closeTarget) {
            closeModal(closeTarget.dataset.closeModal);
            return;
        }

        if (e.target.classList.contains("admin-modal")) {
            e.target.hidden = true;
            return;
        }

        const viewBtn = e.target.closest("[data-job-view]");
        if (viewBtn) {
            openJobDetailModal(viewBtn.dataset.jobView);
            return;
        }

        const jobAct = e.target.closest("[data-job-action], [data-modal-job-action]");
        if (jobAct && !jobAct.disabled) {
            const id = Number(jobAct.dataset.id);
            const action = jobAct.dataset.jobAction || jobAct.dataset.modalJobAction;
            if (!id || !action) return;

            if (jobAct.dataset.modalJobAction) closeModal("job-detail-modal");

            if (action === "rejected") {
                const job = state.jobs.find(j => j.id === id);
                pendingRejectJobId = id;
                const label = document.getElementById("reject-job-label");
                const input = document.getElementById("reject-reason-input");
                if (label) label.textContent = `Tin: "${job?.title || `#${id}`}" — nhập lý do gửi về nhà tuyển dụng:`;
                if (input) input.value = "";
                openModal("reject-modal");
            } else if (action === "closed") {
                openConfirmDialog({
                    title: "Đóng tin tuyển dụng",
                    message: "Tin tuyển dụng sẽ chuyển sang trạng thái Đã đóng và ẩn khỏi danh sách tìm việc công khai.",
                    okLabel: "Đóng tin",
                    danger: false,
                    onConfirm: () => updateJobStatus(id, "closed", null)
                });
            } else {
                updateJobStatus(id, action, null);
            }
            return;
        }

        const delJobBtn = e.target.closest("[data-job-delete], [data-modal-job-delete]");
        if (delJobBtn) {
            const id = Number(delJobBtn.dataset.jobDelete || delJobBtn.dataset.modalJobDelete);
            const job = state.jobs.find(j => j.id === id);
            if (delJobBtn.dataset.modalJobDelete) closeModal("job-detail-modal");

            openConfirmDialog({
                title: "Xóa vĩnh viễn tin tuyển dụng",
                message: `Bạn có chắc chắn muốn xóa tin "${job?.title || `#${id}`}"? Hành động này sẽ xóa cả lịch sử ứng tuyển gắn với tin và không thể hoàn tác.`,
                okLabel: "Xóa vĩnh viễn",
                danger: true,
                onConfirm: () => deleteSingleJob(id)
            });
            return;
        }

        const userToggle = e.target.closest("[data-user-toggle]");
        if (userToggle) {
            const userId = Number(userToggle.dataset.userToggle);
            const nextStatus = userToggle.dataset.nextStatus;
            const userLabel = userToggle.dataset.userLabel || `#${userId}`;
            openConfirmDialog({
                title: nextStatus === "locked" ? "Khóa tài khoản" : "Mở khóa tài khoản",
                message: nextStatus === "locked"
                    ? `Khóa tài khoản "${userLabel}"? Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.`
                    : `Mở khóa lại tài khoản "${userLabel}"?`,
                okLabel: nextStatus === "locked" ? "Khóa tài khoản" : "Mở khóa",
                danger: nextStatus === "locked",
                onConfirm: () => toggleUserStatus(userId, nextStatus)
            });
            return;
        }

        const catDel = e.target.closest("[data-cat-delete]");
        if (catDel && !catDel.disabled) {
            const catId = Number(catDel.dataset.catDelete);
            const catName = catDel.dataset.catName || "";
            openConfirmDialog({
                title: "Xóa danh mục ngành nghề",
                message: `Xóa ngành nghề "${catName}" khỏi hệ thống?`,
                okLabel: "Xóa ngành nghề",
                danger: true,
                onConfirm: async () => {
                    try {
                        const res = await API.delete(`/admin/categories/${catId}`);
                        showToast(res.message || "Đã xóa ngành nghề.");
                        await fetchAdminOverview();
                    } catch (err) {
                        handleApiError(err);
                    }
                }
            });
            return;
        }

        const preset = e.target.closest(".preset-chip");
        if (preset) {
            const input = document.getElementById("reject-reason-input");
            if (input) input.value = preset.dataset.reason || "";
        }
    });

    // Xác nhận từ chối tin
    document.getElementById("confirm-reject-btn")?.addEventListener("click", async () => {
        if (!pendingRejectJobId) return;
        const reason = (document.getElementById("reject-reason-input")?.value || "").trim()
            || "Nội dung chưa đạt yêu cầu kiểm duyệt.";
        const id = pendingRejectJobId;
        pendingRejectJobId = null;
        closeModal("reject-modal");
        await updateJobStatus(id, "rejected", reason);
    });

    // Xác nhận dialog chung
    document.getElementById("confirm-modal-ok")?.addEventListener("click", async () => {
        const fn = pendingConfirmAction;
        pendingConfirmAction = null;
        closeModal("confirm-modal");
        if (typeof fn === "function") await fn();
    });

    // Mở modal dọn tin cũ / quá hạn
    const openCleanupHandler = () => {
        updateCleanupPreview();
        openModal("cleanup-modal");
    };
    document.getElementById("btn-open-cleanup")?.addEventListener("click", openCleanupHandler);
    document.getElementById("overview-cleanup-shortcut")?.addEventListener("click", () => {
        switchSection("jobs");
        openCleanupHandler();
    });

    document.getElementById("cleanup-mode")?.addEventListener("change", updateCleanupPreview);
    document.getElementById("cleanup-days")?.addEventListener("change", updateCleanupPreview);

    document.getElementById("confirm-cleanup-btn")?.addEventListener("click", async () => {
        const mode = document.getElementById("cleanup-mode")?.value || "expired";
        const minAgeDays = Number(document.getElementById("cleanup-days")?.value || 30);
        try {
            const res = await API.post("/admin/jobs/cleanup", { mode, minAgeDays });
            closeModal("cleanup-modal");
            showToast(res.message || "Đã dọn dẹp tin tuyển dụng cũ.");
            await fetchAdminOverview();
        } catch (err) {
            handleApiError(err);
        }
    });

    // Thêm ngành nghề mới
    document.getElementById("add-category-form")?.addEventListener("submit", async function (e) {
        e.preventDefault();
        const nameInput = document.getElementById("new-category-name");
        const descInput = document.getElementById("new-category-desc");
        const name = (nameInput?.value || "").trim();
        const description = (descInput?.value || "").trim();

        if (!name) return;

        try {
            const res = await API.post("/admin/categories", {
                category_name: name,
                description
            });
            if (nameInput) nameInput.value = "";
            if (descInput) descInput.value = "";
            showToast(res.message || "Đã thêm ngành nghề mới.");
            await fetchAdminOverview();
        } catch (err) {
            handleApiError(err);
        }
    });

    // Lưu cài đặt hệ thống vào Database
    document.getElementById("save-settings")?.addEventListener("click", async () => {
        const payload = {
            site_name: (document.getElementById("system-name")?.value || "JobPortal").trim(),
            admin_email: (document.getElementById("admin-email")?.value || "admin@jobportal.com").trim(),
            site_description: (document.getElementById("system-description")?.value || "").trim(),
            require_employer_approval: Boolean(document.getElementById("approve-employer")?.checked),
            require_job_approval: Boolean(document.getElementById("approve-job")?.checked)
        };

        try {
            const res = await API.put("/admin/settings", payload);
            state.settings = res.data || payload;
            applySettingsToUI();
            showToast(res.message || "Đã lưu cài đặt hệ thống.");
        } catch (err) {
            handleApiError(err);
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeAllModals();
    });

    // Tải dữ liệu ban đầu
    fetchAdminOverview();
});
