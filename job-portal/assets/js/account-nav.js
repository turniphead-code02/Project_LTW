
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

    function logout() {
        if (API && typeof API.clearAuthSession === "function") {
            API.clearAuthSession();
        } else {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(TOKEN_KEY);
        }

        window.location.href = "./auth.html";
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

        if (!headerNav || !headerActions) {
            console.warn("Không tìm thấy khu vực menu.");
            return;
        }

        // Xóa menu tài khoản và menu vai trò cũ
        document.getElementById("roleNavLink")?.remove();
        document.getElementById("accountNav")?.remove();

        // Lấy nút dành cho nhà tuyển dụng
        const employerButton = headerActions.querySelector(
            ".btn-employer-slug"
        );

        // Khôi phục các nút đăng nhập, đăng ký
        headerActions.querySelectorAll('a[href*="auth.html"]').forEach(link => {
            link.style.display = "";
        });

        // Nếu chưa đăng nhập
        if (!session) {
            if (employerButton) {
                employerButton.style.display = "";
            }
            return;
        }

        const role = String(session.role || "").toLowerCase();

        const accountName =
            session.fullName ||
            session.name ||
            session.username ||
            session.email ||
            "User";

        const isCandidate = role === "candidate";
        const isEmployer = role === "employer" || role === "hr";
        const isAdmin = role === "admin";

        // Ẩn nút Nhà tuyển dụng đối với Candidate và Admin
        if (employerButton) {
            employerButton.style.display = (isCandidate || isAdmin) ? "none" : "";
        }

        // Ẩn nút đăng nhập và đăng ký
        headerActions.querySelectorAll('a[href*="auth.html"]').forEach(link => {
            link.style.display = "none";
        });

        // Tạo menu theo vai trò
        let roleLink = null;
        let dashboardHref = "./candidate-dashboard.html";

        if (isEmployer) {
            roleLink = createLink(
                "Nhà tuyển dụng",
                "./employer-dashboard.html"
            );
            dashboardHref = "./employer-dashboard.html";
        } else if (isAdmin) {
            roleLink = createLink(
                "Trang Quản Trị",
                "./admin-portal.html"
            );
            dashboardHref = "./admin-portal.html";
        } else if (isCandidate) {
            roleLink = createLink(
                "Hồ Sơ Ứng Viên",
                "./candidate-dashboard.html"
            );
            dashboardHref = "./candidate-dashboard.html";
        }

        if (roleLink) {
            roleLink.id = "roleNavLink";
            headerNav.appendChild(roleLink);
        }

        // Tạo khu vực tài khoản (Tên người dùng bấm được vào trang Dashboard)
        const accountNav = document.createElement("div");
        accountNav.id = "accountNav";

        const nameElement = document.createElement("a");
        nameElement.className = "account-name";
        nameElement.href = dashboardHref;
        nameElement.title = "Mở bảng điều khiển cá nhân";
        nameElement.style.textDecoration = "none";
        nameElement.style.cursor = "pointer";
        nameElement.textContent = accountName;

        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.id = "logoutButton";
        logoutButton.className = "logout-button";
        logoutButton.textContent = "Đăng xuất";
        logoutButton.addEventListener("click", logout);

        accountNav.appendChild(nameElement);
        accountNav.appendChild(logoutButton);

        headerActions.appendChild(accountNav);
    }

    renderAccountNav();

    // Đồng bộ khi đăng nhập hoặc đăng xuất ở tab khác
    window.addEventListener("storage", function (event) {
        if (
            event.key === SESSION_KEY ||
            event.key === TOKEN_KEY
        ) {
            window.location.reload();
        }
    });
});
