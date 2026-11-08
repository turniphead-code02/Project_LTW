
document.addEventListener("DOMContentLoaded", function () {
    const SESSION_KEY = "jobportal_session";
    const headerActions = document.querySelector(".header-actions");

    if (!headerActions) return;

    // Đọc phiên đăng nhập
    let session = null;

    try {
        session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch (error) {
        console.error("Không đọc được phiên đăng nhập:", error);
    }

    // Xóa thanh tài khoản cũ nếu có
    const oldNav = document.getElementById("accountNav");

    if (oldNav) {
        oldNav.remove();
    }

    // Chưa đăng nhập: giữ nguyên nút Đăng nhập và Đăng ký
    if (!session || !session.email) {
        headerActions.querySelectorAll('a[href*="auth.html"]').forEach(link => {
            link.style.display = "";
        });

        return;
    }

    // Lấy tên người dùng
    const displayName =
        session.fullName ||
        session.name ||
        session.companyName ||
        session.email;

    // Ẩn nút đăng nhập và đăng ký
    headerActions.querySelectorAll('a[href*="auth.html"]').forEach(link => {
        link.style.display = "none";
    });

    // Tạo khu vực tài khoản
    const accountNav = document.createElement("div");
    accountNav.id = "accountNav";

    accountNav.style.display = "flex";
    accountNav.style.alignItems = "center";
    accountNav.style.gap = "12px";
    accountNav.style.flexWrap = "wrap";

    // Tên ứng viên
    const accountName = document.createElement("span");
    accountName.className = "account-name";
    accountName.textContent = displayName;

    accountName.style.fontWeight = "600";
    accountName.style.color = "#2563eb";

    // Nút đăng xuất
    const logoutButton = document.createElement("button");
    logoutButton.type = "button";
    logoutButton.textContent = "Đăng xuất";
    logoutButton.className = "logout-button";

    logoutButton.style.padding = "9px 15px";
    logoutButton.style.border = "1px solid #2563eb";
    logoutButton.style.borderRadius = "7px";
    logoutButton.style.background = "#ffffff";
    logoutButton.style.color = "#2563eb";
    logoutButton.style.cursor = "pointer";
    logoutButton.style.fontWeight = "600";

    accountNav.appendChild(accountName);
    accountNav.appendChild(logoutButton);

    headerActions.appendChild(accountNav);

    // Đăng xuất
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "./index.html";
    });
});
