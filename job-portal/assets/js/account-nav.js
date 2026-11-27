document.addEventListener("DOMContentLoaded", function () {
    const API = window.JobPortalAPI;
    const SESSION_KEY = "jobportal_session";
    const TOKEN_KEY = "jobportal_access_token";

    function getSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error("Không đọc được phiên đăng nhập:", error);
            return null;
        }
    }

    function escapeHtml(str) {
        return String(str ?? "").replace(/[&<>"']/g, ch => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[ch]);
    }

    function logout() {
        if (API && typeof API.clearAuthSession === "function") {
            API.clearAuthSession();
        } else {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(TOKEN_KEY);
        }
        window.location.href = "./auth.html?mode=login";
    }

    function createLink(text, href) {
        const link = document.createElement("a");
        link.textContent = text;
        link.href = href;
        link.className = "nav-link";
        return link;
    }

    function renderAccountNav() {
        const session = getSession();
        const headerNav = document.querySelector(".header-nav");
        const headerActions = document.querySelector(".header-actions");

        if (!headerNav || !headerActions) return;

        document.getElementById("roleNavLink")?.remove();
        document.getElementById("accountNav")?.remove();

        const employerButton = headerActions.querySelector(".btn-employer-slug");
        headerActions.querySelectorAll('a[href*="auth.html"]').forEach(link => {
            link.style.display = "";
        });

        if (!session) {
            if (employerButton) employerButton.style.display = "";
            return;
        }

        const role = String(session.role || "").toLowerCase();
        const accountName =
            session.fullName ||
            session.name ||
            session.username ||
            session.email ||
            "Tài khoản";
        const accountEmail = session.email || "";
        const initial = String(accountName).trim().charAt(0).toUpperCase() || "U";

        const isCandidate = role === "candidate";
        const isEmployer = role === "employer" || role === "hr";
        const isAdmin = role === "admin";

        if (employerButton) {
            employerButton.style.display = (isCandidate || isAdmin) ? "none" : "";
        }

        headerActions.querySelectorAll('a[href*="auth.html"]').forEach(link => {
            link.style.display = "none";
        });

        let roleMeta = {
            navText: "Hồ Sơ Ứng Viên",
            roleBadge: "Ứng viên",
            roleClass: "is-candidate",
            dashboardHref: "./candidate-dashboard.html",
            items: [
                { icon: "fa-regular fa-user", label: "Hồ sơ cá nhân & CV", href: "./candidate-dashboard.html" },
                { icon: "fa-regular fa-file-lines", label: "Đơn đã ứng tuyển", href: "./my-applications.html" },
                { icon: "fa-regular fa-bookmark", label: "Việc làm đã lưu", href: "./saved-jobs.html" }
            ]
        };

        if (isEmployer) {
            roleMeta = {
                navText: "Nhà Tuyển Dụng",
                roleBadge: "Nhà tuyển dụng",
                roleClass: "is-employer",
                dashboardHref: "./employer-dashboard.html",
                items: [
                    { icon: "fa-solid fa-gauge-high", label: "Bảng điều khiển HR", href: "./employer-dashboard.html" },
                    { icon: "fa-solid fa-plus-circle", label: "Đăng tin tuyển dụng", href: "./post-job.html" },
                    { icon: "fa-solid fa-users", label: "Quản lý ứng viên", href: "./candidate-management.html" }
                ]
            };
        } else if (isAdmin) {
            roleMeta = {
                navText: "Trang Quản Trị",
                roleBadge: "Quản trị viên",
                roleClass: "is-admin",
                dashboardHref: "./admin-portal.html",
                items: [
                    { icon: "fa-solid fa-shield-halved", label: "Admin Console", href: "./admin-portal.html" },
                    { icon: "fa-solid fa-magnifying-glass", label: "Xem sàn việc làm", href: "./jobs.html" }
                ]
            };
        }

        const roleLink = createLink(roleMeta.navText, roleMeta.dashboardHref);
        roleLink.id = "roleNavLink";
        headerNav.appendChild(roleLink);

        const accountNav = document.createElement("div");
        accountNav.id = "accountNav";
        accountNav.className = "account-nav-wrap";

        const menuLinksHtml = roleMeta.items.map(item => `
            <a href="${item.href}" class="account-menu-item">
                <i class="${item.icon}" aria-hidden="true"></i>
                <span>${escapeHtml(item.label)}</span>
            </a>
        `).join("");

        accountNav.innerHTML = `
            <button type="button" class="account-trigger ${roleMeta.roleClass}" id="accountTrigger" aria-expanded="false" aria-haspopup="menu">
                <span class="account-avatar">${escapeHtml(initial)}</span>
                <span class="account-trigger-text">
                    <span class="account-name">${escapeHtml(accountName)}</span>
                    <span class="account-role-pill">${escapeHtml(roleMeta.roleBadge)}</span>
                </span>
                <svg class="account-chevron" width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div class="account-dropdown" id="accountDropdown" role="menu" hidden>
                <div class="account-dropdown-head">
                    <div class="account-avatar lg ${roleMeta.roleClass}">${escapeHtml(initial)}</div>
                    <div class="account-dropdown-info">
                        <strong>${escapeHtml(accountName)}</strong>
                        ${accountEmail ? `<small>${escapeHtml(accountEmail)}</small>` : ""}
                        <span class="account-role-badge ${roleMeta.roleClass}">${escapeHtml(roleMeta.roleBadge)}</span>
                    </div>
                </div>
                <div class="account-dropdown-list">
                    ${menuLinksHtml}
                </div>
                <div class="account-dropdown-foot">
                    <button type="button" id="logoutButton" class="account-logout-item" role="menuitem">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>
        `;

        const mobileToggle = headerActions.querySelector(".mobile-toggle-btn");
        if (mobileToggle) {
            headerActions.insertBefore(accountNav, mobileToggle);
        } else {
            headerActions.appendChild(accountNav);
        }

        const trigger = document.getElementById("accountTrigger");
        const dropdown = document.getElementById("accountDropdown");
        const logoutBtn = document.getElementById("logoutButton");

        function setOpen(open) {
            if (!trigger || !dropdown) return;
            dropdown.hidden = !open;
            trigger.setAttribute("aria-expanded", String(open));
            accountNav.classList.toggle("is-open", open);
        }

        trigger?.addEventListener("click", function (e) {
            e.stopPropagation();
            setOpen(dropdown.hidden);
        });

        logoutBtn?.addEventListener("click", logout);

        document.addEventListener("click", function (e) {
            if (!accountNav.contains(e.target)) setOpen(false);
        });

        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") setOpen(false);
        });
    }

    renderAccountNav();

    window.addEventListener("storage", function (event) {
        if (event.key === SESSION_KEY || event.key === TOKEN_KEY) {
            window.location.reload();
        }
    });
});
