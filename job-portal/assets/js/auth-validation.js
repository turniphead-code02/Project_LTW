
document.addEventListener("DOMContentLoaded", function () {
    // ==========================================
    // 1. CẤU HÌNH
    // ==========================================

    const USER_KEY = "jobportal_users";
    const SESSION_KEY = "jobportal_session";
    const EMPLOYER_KEY = "jobportal_employers";

    const ADMIN_EMAIL = "admin@jobportal.com";
    const ADMIN_PASSWORD = "Admin@123";

    const $ = id => document.getElementById(id);

    const authForm = $("authForm");
    const loginTab = $("loginTab");
    const registerTab = $("registerTab");
    const submitButton = $("submitButton");

    const nameGroup = $("nameGroup");
    const confirmGroup = $("confirmGroup");
    const roleGroup = $("roleGroup");
    const strengthGroup = $("strengthGroup");
    const loginOptions = $("loginOptions");

    const formTitle = $("formTitle");
    const formDescription = $("formDescription");
    const switchText = $("switchText");
    const switchButton = $("switchButton");
    const formMessage = $("formMessage");

    const fullName = $("fullName");
    const email = $("email");
    const password = $("password");
    const confirmPassword = $("confirmPassword");
    const role = $("role");

    const strengthBar = $("strengthBar");
    const strengthText = $("strengthText");

    const forgotPassword = $("forgotPassword");
    const forgotModal = $("forgotModal");
    const forgotForm = $("forgotForm");
    const forgotEmail = $("forgotEmail");
    const forgotMessage = $("forgotMessage");
    const closeForgot = $("closeForgot");
    const backToLogin = $("backToLogin");

    if (!authForm || !submitButton) {
        console.error("Không tìm thấy form đăng nhập trong auth.html");
        return;
    }

    let currentMode = "login";

    // ==========================================
    // 2. HÀM LOCAL STORAGE
    // ==========================================

    function readStorage(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value === null ? fallback : value;
        } catch (error) {
            console.error("Lỗi đọc localStorage:", key, error);
            return fallback;
        }
    }

    function writeStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function getUsers() {
        const users = readStorage(USER_KEY, []);
        return Array.isArray(users) ? users : [];
    }

    function getEmployers() {
        const employers = readStorage(EMPLOYER_KEY, []);
        return Array.isArray(employers) ? employers : [];
    }

    function normalizeEmail(value) {
        return String(value || "").trim().toLowerCase();
    }

    function normalizeRole(value) {
        const normalized = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[\s_-]/g, "");

        if (["admin", "administrator", "quantri"].includes(normalized)) {
            return "admin";
        }

        if (
            ["employer", "company", "business", "nhatuyendung"].includes(normalized)
        ) {
            return "employer";
        }

        return "candidate";
    }

    function normalizeStatus(value) {
        const status = String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[\s_-]/g, "");

        if (
            ["approved", "active", "accepted", "approvedaccount", "đãduyệt", "daduyet"].includes(status)
        ) {
            return "approved";
        }

        if (
            ["rejected", "declined", "denied", "tuchoi", "đãtừchối", "datuchoi"].includes(status)
        ) {
            return "rejected";
        }

        return "pending";
    }

    function showMessage(message, type = "error") {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.style.display = "block";
        formMessage.style.marginTop = "15px";
        formMessage.style.padding = "12px";
        formMessage.style.borderRadius = "8px";

        if (type === "success") {
            formMessage.style.color = "#166534";
            formMessage.style.background = "#dcfce7";
        } else {
            formMessage.style.color = "#991b1b";
            formMessage.style.background = "#fee2e2";
        }
    }

    function clearMessage() {
        if (!formMessage) return;

        formMessage.textContent = "";
        formMessage.style.display = "none";
    }

    // ==========================================
    // 3. TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
    // ==========================================

    function initializeAdmin() {
        const users = getUsers();

        const existingAdmin = users.find(user =>
            normalizeEmail(user.email) === ADMIN_EMAIL
        );

        if (!existingAdmin) {
            users.push({
                id: "admin-default",
                fullName: "Quản trị viên",
                name: "Quản trị viên",
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                role: "admin",
                status: "approved",
                approvalStatus: "approved",
                createdAt: new Date().toISOString()
            });

            writeStorage(USER_KEY, users);
        }
    }

    initializeAdmin();

    // ==========================================
    // 4. CHUYỂN ĐỔI ĐĂNG NHẬP / ĐĂNG KÝ
    // ==========================================

    function setMode(mode) {
        currentMode = mode;
        clearMessage();

        const isLogin = mode === "login";

        loginTab.classList.toggle("active", isLogin);
        registerTab.classList.toggle("active", !isLogin);

        nameGroup.hidden = isLogin;
        confirmGroup.hidden = isLogin;
        roleGroup.hidden = isLogin;
        strengthGroup.hidden = isLogin;
        loginOptions.hidden = !isLogin;

        fullName.required = !isLogin;
        confirmPassword.required = !isLogin;
        role.required = !isLogin;

        formTitle.textContent = isLogin ? "Đăng nhập" : "Tạo tài khoản";

        formDescription.textContent = isLogin
            ? "Đăng nhập để tiếp tục sử dụng JobPortal."
            : "Đăng ký tài khoản để bắt đầu sử dụng JobPortal.";

        submitButton.textContent = isLogin
            ? "Đăng nhập"
            : "Tạo tài khoản";

        switchText.textContent = isLogin
            ? "Bạn chưa có tài khoản?"
            : "Bạn đã có tài khoản?";

        switchButton.textContent = isLogin
            ? "Đăng ký ngay"
            : "Đăng nhập ngay";
    }

    loginTab.addEventListener("click", () => setMode("login"));
    registerTab.addEventListener("click", () => setMode("register"));

    switchButton.addEventListener("click", function (event) {
        event.preventDefault();

        setMode(currentMode === "login" ? "register" : "login");
    });

    // Hỗ trợ đường dẫn auth.html?mode=register
    const params = new URLSearchParams(window.location.search);

    if (params.get("mode") === "register") {
        setMode("register");
    } else {
        setMode("login");
    }

    // ==========================================
    // 5. KIỂM TRA ĐỘ MẠNH MẬT KHẨU
    // ==========================================

    password.addEventListener("input", function () {
        if (currentMode !== "register") return;

        const value = password.value;
        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        const levels = [
            { width: "0%", text: "Chưa nhập mật khẩu" },
            { width: "20%", text: "Rất yếu" },
            { width: "40%", text: "Yếu" },
            { width: "60%", text: "Trung bình" },
            { width: "80%", text: "Mạnh" },
            { width: "100%", text: "Rất mạnh" }
        ];

        strengthBar.style.width = levels[score].width;
        strengthText.textContent = levels[score].text;
    });

    // ==========================================
    // 6. ĐĂNG KÝ TÀI KHOẢN
    // ==========================================

    function registerAccount() {
        const name = fullName.value.trim();
        const userEmail = normalizeEmail(email.value);
        const userPassword = password.value;
        const confirm = confirmPassword.value;
        const selectedRole = normalizeRole(role.value);

        if (!name || !userEmail || !userPassword || !confirm) {
            showMessage("Vui lòng nhập đầy đủ thông tin.");
            return;
        }

        if (userPassword.length < 8) {
            showMessage("Mật khẩu phải có ít nhất 8 ký tự.");
            return;
        }

        if (userPassword !== confirm) {
            showMessage("Mật khẩu xác nhận không khớp.");
            return;
        }

        const users = getUsers();

        const duplicate = users.some(user =>
            normalizeEmail(user.email) === userEmail
        );

        if (duplicate) {
            showMessage("Email này đã được đăng ký. Vui lòng sử dụng email khác.");
            return;
        }

        const createdAt = new Date().toISOString();

        const newUser = {
            id: "user_" + Date.now(),
            fullName: name,
            name: name,
            companyName: selectedRole === "employer" ? name : "",
            email: userEmail,
            password: userPassword,
            role: selectedRole,
            status: selectedRole === "employer" ? "pending" : "approved",
            approvalStatus: selectedRole === "employer" ? "pending" : "approved",
            reason: "",
            rejectionReason: "",
            createdAt: createdAt,
            date: createdAt
        };

        users.push(newUser);
        writeStorage(USER_KEY, users);

        // Đồng bộ doanh nghiệp vào danh sách quản trị
        if (selectedRole === "employer") {
            const employers = getEmployers();

            employers.push({
                id: newUser.id,
                userId: newUser.id,
                name: name,
                email: userEmail,
                date: createdAt,
                status: "pending",
                reason: ""
            });

            writeStorage(EMPLOYER_KEY, employers);

            showMessage(
                "Đăng ký thành công! Tài khoản doanh nghiệp đang chờ quản trị viên phê duyệt.",
                "success"
            );
        } else {
            showMessage(
                "Đăng ký thành công! Bạn có thể đăng nhập ngay.",
                "success"
            );
        }

        authForm.reset();

        if (strengthBar) strengthBar.style.width = "0%";
        if (strengthText) strengthText.textContent = "Chưa nhập mật khẩu";

        setTimeout(() => {
            setMode("login");
            email.value = userEmail;
        }, 1500);
    }

    // ==========================================
    // 7. ĐĂNG NHẬP
    // ==========================================

    function loginAccount() {
        const userEmail = normalizeEmail(email.value);
        const userPassword = password.value;

        if (!userEmail || !userPassword) {
            showMessage("Vui lòng nhập email và mật khẩu.");
            return;
        }

        const users = getUsers();

        const user = users.find(item =>
            normalizeEmail(item.email) === userEmail &&
            String(item.password || "") === userPassword
        );

        if (!user) {
            showMessage("Email hoặc mật khẩu không chính xác.");
            return;
        }

        const userRole = normalizeRole(user.role || user.userRole);

        // Tài khoản quản trị
        if (userRole === "admin") {
            const session = {
                id: user.id,
                fullName: user.fullName || user.name || "Quản trị viên",
                name: user.fullName || user.name || "Quản trị viên",
                email: user.email,
                role: "admin",
                loginAt: new Date().toISOString()
            };

            writeStorage(SESSION_KEY, session);

            showMessage("Đăng nhập quản trị thành công!", "success");

            setTimeout(() => {
                window.location.href = "./admin-portal.html";
            }, 500);

            return;
        }

        // Kiểm tra trạng thái doanh nghiệp
        if (userRole === "employer") {
            const employers = getEmployers();

            const employer = employers.find(item =>
                normalizeEmail(item.email) === userEmail
            );

            const status = normalizeStatus(
                employer?.status ||
                user.approvalStatus ||
                user.status
            );

            if (status === "pending") {
                showMessage(
                    "Tài khoản doanh nghiệp của bạn đang chờ quản trị viên phê duyệt."
                );
                return;
            }

            if (status === "rejected") {
                const reason =
                    employer?.reason ||
                    employer?.rejectionReason ||
                    user.reason ||
                    user.rejectionReason ||
                    "Vui lòng liên hệ quản trị viên để biết thêm chi tiết.";

                showMessage("Tài khoản đã bị từ chối. Lý do: " + reason);
                return;
            }
        }

        // Tạo phiên đăng nhập
        const session = {
            id: user.id,
            fullName: user.fullName || user.name || user.companyName || user.email,
            name: user.fullName || user.name || user.companyName || user.email,
            companyName: user.companyName || "",
            email: user.email,
            role: userRole,
            loginAt: new Date().toISOString()
        };

        writeStorage(SESSION_KEY, session);

        showMessage("Đăng nhập thành công!", "success");

        // Chuyển trang theo vai trò
        setTimeout(() => {
            if (userRole === "employer") {
                window.location.href = "./employer-dashboard.html";
            } else {
                window.location.href = "./jobs.html";
            }
        }, 500);
    }

    // ==========================================
    // 8. XỬ LÝ SUBMIT FORM
    // ==========================================

    authForm.addEventListener("submit", function (event) {
        event.preventDefault();
        clearMessage();

        submitButton.disabled = true;

        try {
            if (currentMode === "login") {
                loginAccount();
            } else {
                registerAccount();
            }
        } catch (error) {
            console.error("Lỗi xác thực:", error);
            showMessage("Có lỗi xảy ra. Vui lòng kiểm tra lại dữ liệu.");
        } finally {
            submitButton.disabled = false;
        }
    });

    // ==========================================
    // 9. QUÊN MẬT KHẨU - BẢN DEMO LOCAL
    // ==========================================

    function openForgotModal() {
        if (!forgotModal) return;

        forgotModal.style.display = "flex";

        if (forgotMessage) {
            forgotMessage.textContent = "";
        }

        if (email.value.trim()) {
            forgotEmail.value = email.value.trim();
        }
    }

    function closeForgotModal() {
        if (forgotModal) {
            forgotModal.style.display = "none";
        }
    }

    if (forgotPassword) {
        forgotPassword.addEventListener("click", function (event) {
            event.preventDefault();
            openForgotModal();
        });
    }

    if (closeForgot) {
        closeForgot.addEventListener("click", closeForgotModal);
    }

    if (backToLogin) {
        backToLogin.addEventListener("click", closeForgotModal);
    }

    if (forgotModal) {
        forgotModal.addEventListener("click", function (event) {
            if (event.target === forgotModal) {
                closeForgotModal();
            }
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const forgotUserEmail = normalizeEmail(forgotEmail.value);
            const users = getUsers();

            const user = users.find(item =>
                normalizeEmail(item.email) === forgotUserEmail
            );

            if (!user) {
                forgotMessage.textContent = "Không tìm thấy tài khoản với email này.";
                forgotMessage.style.color = "#dc2626";
                return;
            }

            forgotMessage.textContent =
                "Tài khoản tồn tại. Đây là bản demo local, vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.";

            forgotMessage.style.color = "#15803d";
        });
    }

    // ==========================================
    // 10. KIỂM TRA PHIÊN ĐĂNG NHẬP CŨ
    // ==========================================

    const existingSession = readStorage(SESSION_KEY, null);

    if (existingSession && existingSession.email) {
        console.log("Đang có phiên đăng nhập:", existingSession.email);
    }

    console.log("JobPortal authentication đã khởi tạo.");
});
