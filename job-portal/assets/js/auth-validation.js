
/* =========================================
   JOBPORTAL - AUTH VALIDATION & API CONNECT
   Module 5 - Đăng nhập, đăng ký và quên mật khẩu OTP
========================================= */

document.addEventListener("DOMContentLoaded", function () {
    const API = window.JobPortalAPI;

    // Các phần tử giao diện
    const authForm = document.getElementById("authForm");
    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    const nameGroup = document.getElementById("nameGroup");
    const confirmGroup = document.getElementById("confirmGroup");
    const roleGroup = document.getElementById("roleGroup");
    const strengthGroup = document.getElementById("strengthGroup");
    const loginOptions = document.getElementById("loginOptions");

    const formTitle = document.getElementById("formTitle");
    const formDescription = document.getElementById("formDescription");
    const submitButton = document.getElementById("submitButton");
    const switchText = document.getElementById("switchText");
    const switchButton = document.getElementById("switchButton");
    const formMessage = document.getElementById("formMessage");

    const fullName = document.getElementById("fullName");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const forgotPassword = document.getElementById("forgotPassword");

    const roleSelect =
        document.getElementById("roleSelect") ||
        document.getElementById("role");

    let isRegister = false;
    let resetPanel = null;

    // =========================================
    // KIỂM TRA API
    // =========================================

    function checkAPI() {
        if (!API || typeof API.post !== "function") {
            showMessage(
                "Không tìm thấy API client. Hãy kiểm tra file api.js."
            );
            console.error("window.JobPortalAPI chưa được khởi tạo.");
            return false;
        }

        return true;
    }

    // =========================================
    // THÔNG BÁO
    // =========================================

    function showMessage(message, success = false) {
        if (!formMessage) return;

        formMessage.textContent = message;
        formMessage.classList.toggle("success", success);
    }

    function clearErrors() {
        document.querySelectorAll(".error-message").forEach(item => {
            item.textContent = "";
        });

        document.querySelectorAll(".form-group input").forEach(input => {
            input.classList.remove("invalid");
        });
    }

    function showError(input, message) {
        if (!input) return;

        input.classList.add("invalid");

        const error = input.parentElement
            ? input.parentElement.querySelector(".error-message")
            : null;

        if (error) error.textContent = message;
    }

    // =========================================
    // CHUYỂN GIAO DIỆN ĐĂNG NHẬP / ĐĂNG KÝ
    // =========================================

    function setMode(register) {
        isRegister = register;

        closeResetPanel();

        if (nameGroup) nameGroup.hidden = !register;
        if (confirmGroup) confirmGroup.hidden = !register;
        if (roleGroup) roleGroup.hidden = !register;
        if (strengthGroup) strengthGroup.hidden = !register;
        if (loginOptions) loginOptions.hidden = register;

        if (loginTab) {
            loginTab.classList.toggle("active", !register);
        }

        if (registerTab) {
            registerTab.classList.toggle("active", register);
        }

        if (formTitle) {
            formTitle.textContent = register
                ? "Tạo tài khoản mới"
                : "Chào mừng trở lại!";
        }

        if (formDescription) {
            formDescription.textContent = register
                ? "Đăng ký để bắt đầu sử dụng JobPortal."
                : "Đăng nhập để tiếp tục sử dụng JobPortal.";
        }

        if (submitButton) {
            submitButton.textContent = register
                ? "Tạo tài khoản"
                : "Đăng nhập";
        }

        if (switchText) {
            switchText.textContent = register
                ? "Đã có tài khoản?"
                : "Chưa có tài khoản?";
        }

        if (switchButton) {
            switchButton.textContent = register
                ? "Đăng nhập ngay"
                : "Đăng ký ngay";
        }

        showMessage("");
        clearErrors();
    }

    // =========================================
    // KIỂM TRA EMAIL
    // =========================================

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    // =========================================
    // KIỂM TRA ĐỘ MẠNH MẬT KHẨU
    // =========================================

    function checkPasswordStrength(value) {
        let score = 0;

        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[a-z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        const bars = document.querySelectorAll(".strength-bars span");

        bars.forEach((bar, index) => {
            bar.classList.toggle("active", index < Math.min(score, 4));
        });

        const labels = [
            "Chưa có mật khẩu",
            "Rất yếu",
            "Yếu",
            "Trung bình",
            "Mạnh",
            "Rất mạnh"
        ];

        const strengthText = document.getElementById("strengthText");

        if (strengthText) {
            strengthText.textContent = "Độ mạnh: " + labels[score];
        }

        return score;
    }

    if (password) {
        password.addEventListener("input", function () {
            if (isRegister) {
                checkPasswordStrength(password.value);
            }
        });
    }

    // =========================================
    // KIỂM TRA FORM ĐĂNG NHẬP / ĐĂNG KÝ
    // =========================================

    function validateForm() {
        clearErrors();

        let valid = true;

        if (isRegister && fullName && fullName.value.trim().length < 2) {
            showError(fullName, "Vui lòng nhập họ tên hợp lệ.");
            valid = false;
        }

        if (!email || !isValidEmail(email.value.trim())) {
            showError(email, "Email không đúng định dạng.");
            valid = false;
        }

        if (!password || password.value.length === 0) {
            showError(password, "Vui lòng nhập mật khẩu.");
            valid = false;
        } else if (isRegister && password.value.length < 8) {
            showError(password, "Mật khẩu phải có ít nhất 8 ký tự.");
            valid = false;
        }

        if (isRegister && password) {
            if (checkPasswordStrength(password.value) < 3) {
                showError(password, "Mật khẩu cần mạnh hơn.");
                valid = false;
            }

            if (
                confirmPassword &&
                password.value !== confirmPassword.value
            ) {
                showError(confirmPassword, "Mật khẩu xác nhận không khớp.");
                valid = false;
            }
        }

        return valid;
    }

    // =========================================
    // GIAO DIỆN QUÊN MẬT KHẨU
    // =========================================

    function createResetPanel() {
        if (resetPanel) return resetPanel;

        resetPanel = document.createElement("section");
        resetPanel.id = "passwordResetPanel";

        resetPanel.innerHTML = `
            <div class="reset-header">
                <h2>Quên mật khẩu?</h2>
                <p>
                    Nhập email đã đăng ký. JobPortal sẽ gửi mã OTP
                    để bạn đặt lại mật khẩu.
                </p>
            </div>

            <div class="reset-group">
                <label for="resetEmail">Địa chỉ email</label>
                <input
                    type="email"
                    id="resetEmail"
                    placeholder="Nhập email của bạn"
                    autocomplete="email"
                >
            </div>

            <button type="button" id="sendOtpButton">
                Gửi mã OTP
            </button>

            <div id="otpResetFields" hidden>
                <div class="reset-group">
                    <label for="resetOtp">Mã OTP gồm 6 chữ số</label>
                    <input
                        type="text"
                        id="resetOtp"
                        placeholder="Nhập mã OTP"
                        maxlength="6"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                    >
                </div>

                <div class="reset-group">
                    <label for="newPassword">Mật khẩu mới</label>
                    <input
                        type="password"
                        id="newPassword"
                        placeholder="Nhập mật khẩu mới"
                        autocomplete="new-password"
                    >
                </div>

                <div class="reset-group">
                    <label for="newPasswordConfirm">
                        Xác nhận mật khẩu mới
                    </label>
                    <input
                        type="password"
                        id="newPasswordConfirm"
                        placeholder="Nhập lại mật khẩu mới"
                        autocomplete="new-password"
                    >
                </div>

                <button type="button" id="resetPasswordButton">
                    Đặt lại mật khẩu
                </button>

                <button type="button" id="resendOtpButton" class="reset-secondary">
                    Gửi lại mã OTP
                </button>
            </div>

            <p id="resetMessage" role="status" aria-live="polite"></p>

            <button type="button" id="backToLoginButton" class="reset-back">
                ← Quay lại đăng nhập
            </button>
        `;

        const style = document.createElement("style");

        style.textContent = `
            #passwordResetPanel {
                width: 100%;
                margin-top: 16px;
                padding: 22px;
                box-sizing: border-box;
                border-radius: 12px;
                background: #fff;
                color: #243047;
            }

            #passwordResetPanel .reset-header {
                margin-bottom: 20px;
            }

            #passwordResetPanel .reset-header h2 {
                margin: 0 0 8px;
                font-size: 23px;
            }

            #passwordResetPanel .reset-header p {
                margin: 0;
                line-height: 1.6;
                color: #64748b;
            }

            #passwordResetPanel .reset-group {
                margin-bottom: 16px;
            }

            #passwordResetPanel label {
                display: block;
                margin-bottom: 7px;
                font-weight: 600;
            }

            #passwordResetPanel input {
                display: block;
                width: 100%;
                min-height: 45px;
                padding: 10px 12px;
                box-sizing: border-box;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                font-size: 15px;
                outline: none;
            }

            #passwordResetPanel input:focus {
                border-color: #2563eb;
            }

            #passwordResetPanel button {
                display: block;
                width: 100%;
                min-height: 45px;
                margin-top: 10px;
                border: 0;
                border-radius: 8px;
                background: #2563eb;
                color: white;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
            }

            #passwordResetPanel button:disabled {
                opacity: .6;
                cursor: not-allowed;
            }

            #passwordResetPanel button.reset-secondary {
                background: #eaf0ff;
                color: #2563eb;
            }

            #passwordResetPanel button.reset-back {
                margin-top: 18px;
                background: transparent;
                color: #475569;
            }

            #resetMessage {
                margin: 14px 0 0;
                line-height: 1.5;
                color: #dc2626;
            }

            #resetMessage.success {
                color: #15803d;
            }
        `;

        document.head.appendChild(style);

        if (authForm && authForm.parentElement) {
            authForm.insertAdjacentElement("afterend", resetPanel);
        } else {
            document.body.appendChild(resetPanel);
        }

        resetPanel.hidden = true;

        // Các phần tử OTP
        const resetEmail = resetPanel.querySelector("#resetEmail");
        const sendOtpButton = resetPanel.querySelector("#sendOtpButton");
        const otpResetFields = resetPanel.querySelector("#otpResetFields");
        const resetOtp = resetPanel.querySelector("#resetOtp");
        const newPassword = resetPanel.querySelector("#newPassword");
        const newPasswordConfirm = resetPanel.querySelector("#newPasswordConfirm");
        const resetPasswordButton = resetPanel.querySelector("#resetPasswordButton");
        const resendOtpButton = resetPanel.querySelector("#resendOtpButton");
        const resetMessage = resetPanel.querySelector("#resetMessage");
        const backButton = resetPanel.querySelector("#backToLoginButton");

        function showResetMessage(message, success = false) {
            resetMessage.textContent = message;
            resetMessage.classList.toggle("success", success);
        }

        function getResetEmail() {
            const value = resetEmail.value.trim().toLowerCase();

            if (!isValidEmail(value)) {
                showResetMessage("Vui lòng nhập địa chỉ email hợp lệ.");
                resetEmail.focus();
                return null;
            }

            return value;
        }

        // Gửi OTP
        async function sendOtp() {
            if (!checkAPI()) return;

            const normalizedEmail = getResetEmail();
            if (!normalizedEmail) return;

            sendOtpButton.disabled = true;
            sendOtpButton.textContent = "Đang gửi OTP...";
            showResetMessage("");

            try {
                const result = await API.post(
                    "/auth/forgot-password",
                    { email: normalizedEmail }
                );

                if (!result || result.success !== true) {
                    throw new Error(
                        result?.message || "Không thể gửi mã OTP."
                    );
                }

                otpResetFields.hidden = false;

                showResetMessage(
                    result.message ||
                    "Nếu email tồn tại trong hệ thống, mã OTP sẽ được gửi đến hộp thư của bạn.",
                    true
                );

                resetOtp.focus();

            } catch (error) {
                console.error("SEND OTP ERROR:", error);

                showResetMessage(
                    error.message || "Không thể gửi OTP. Vui lòng thử lại."
                );

            } finally {
                sendOtpButton.disabled = false;
                sendOtpButton.textContent = "Gửi mã OTP";
            }
        }

        sendOtpButton.addEventListener("click", sendOtp);
        resendOtpButton.addEventListener("click", sendOtp);

        // Chỉ cho phép nhập chữ số trong OTP
        resetOtp.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "").slice(0, 6);
        });

        // Đặt lại mật khẩu
        resetPasswordButton.addEventListener("click", async function () {
            if (!checkAPI()) return;

            const normalizedEmail = getResetEmail();
            if (!normalizedEmail) return;

            const otp = resetOtp.value.trim();
            const newPasswordValue = newPassword.value;
            const confirmValue = newPasswordConfirm.value;

            if (!/^\d{6}$/.test(otp)) {
                showResetMessage("Mã OTP phải gồm đúng 6 chữ số.");
                resetOtp.focus();
                return;
            }

            if (newPasswordValue.length < 8) {
                showResetMessage("Mật khẩu mới phải có ít nhất 8 ký tự.");
                newPassword.focus();
                return;
            }

            if (newPasswordValue !== confirmValue) {
                showResetMessage("Mật khẩu xác nhận không khớp.");
                newPasswordConfirm.focus();
                return;
            }

            resetPasswordButton.disabled = true;
            resetPasswordButton.textContent = "Đang cập nhật...";
            showResetMessage("");

            try {
                const result = await API.post(
                    "/auth/reset-password",
                    {
                        email: normalizedEmail,
                        otp: otp,
                        new_password: newPasswordValue
                    }
                );

                if (!result || result.success !== true) {
                    throw new Error(
                        result?.message || "Không thể đặt lại mật khẩu."
                    );
                }

                showResetMessage(
                    result.message ||
                    "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập.",
                    true
                );

                // Xóa dữ liệu mật khẩu khỏi giao diện
                resetOtp.value = "";
                newPassword.value = "";
                newPasswordConfirm.value = "";

                if (email) {
                    email.value = normalizedEmail;
                }

                setTimeout(() => {
                    closeResetPanel();
                    showMessage(
                        "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
                        true
                    );

                    if (password) {
                        password.value = "";
                        password.focus();
                    }
                }, 1800);

            } catch (error) {
                console.error("RESET PASSWORD ERROR:", error);

                showResetMessage(
                    error.message || "Không thể đặt lại mật khẩu."
                );

            } finally {
                resetPasswordButton.disabled = false;
                resetPasswordButton.textContent = "Đặt lại mật khẩu";
            }
        });

        // Quay lại đăng nhập
        backButton.addEventListener("click", function () {
            closeResetPanel();
            showMessage("");

            if (email) email.focus();
        });

        return resetPanel;
    }

    // =========================================
    // MỞ / ĐÓNG GIAO DIỆN QUÊN MẬT KHẨU
    // =========================================

    function openResetPanel() {
        if (isRegister) {
            setMode(false);
        }

        const panel = createResetPanel();

        if (authForm) authForm.hidden = true;
        if (loginTab) loginTab.hidden = true;
        if (registerTab) registerTab.hidden = true;

        if (switchText) switchText.hidden = true;
        if (switchButton) switchButton.hidden = true;

        if (formTitle) formTitle.hidden = true;
        if (formDescription) formDescription.hidden = true;

        showMessage("");

        panel.hidden = false;

        const resetEmail = panel.querySelector("#resetEmail");

        if (email && email.value.trim()) {
            resetEmail.value = email.value.trim();
        }

        resetEmail.focus();
    }

    function closeResetPanel() {
        if (resetPanel) {
            resetPanel.hidden = true;
        }

        if (authForm) authForm.hidden = false;

        if (loginTab) loginTab.hidden = false;
        if (registerTab) registerTab.hidden = false;

        if (switchText) switchText.hidden = false;
        if (switchButton) switchButton.hidden = false;

        if (formTitle) formTitle.hidden = false;
        if (formDescription) formDescription.hidden = false;
    }

    if (forgotPassword) {
        forgotPassword.addEventListener("click", function (event) {
            event.preventDefault();
            openResetPanel();
        });
    }

    // =========================================
    // CHUYỂN TAB
    // =========================================

    if (loginTab) {
        loginTab.addEventListener("click", () => setMode(false));
    }

    if (registerTab) {
        registerTab.addEventListener("click", () => setMode(true));
    }

    if (switchButton) {
        switchButton.addEventListener("click", () => {
            setMode(!isRegister);
        });
    }

    // =========================================
    // ĐĂNG NHẬP / ĐĂNG KÝ
    // =========================================

    if (authForm) {
        authForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            showMessage("");

            if (!validateForm()) {
                showMessage("Vui lòng kiểm tra lại thông tin.");
                return;
            }

            if (!checkAPI()) return;

            const payload = {
                email: email.value.trim(),
                password: password.value
            };

            if (isRegister) {
                payload.full_name = fullName.value.trim();
                payload.role = roleSelect ? roleSelect.value : "candidate";

                if (payload.role === "employer") {
                    const companyName = prompt(
                        "Vui lòng nhập tên công ty của bạn:"
                    );

                    if (!companyName || !companyName.trim()) {
                        showMessage("Vui lòng nhập tên công ty.");
                        return;
                    }

                    payload.company_name = companyName.trim();
                }
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Đang xử lý...";
            }

            try {
                const endpoint = isRegister
                    ? "/auth/register"
                    : "/auth/login";

                const result = await API.post(endpoint, payload);

                if (!result || result.success !== true) {
                    throw new Error(
                        result?.message ||
                        "Máy chủ trả về dữ liệu không hợp lệ."
                    );
                }

                // ĐĂNG KÝ THÀNH CÔNG
                if (isRegister) {
                    showMessage(
                        result.message ||
                        "Đăng ký thành công! Vui lòng đăng nhập.",
                        true
                    );

                    authForm.reset();

                    setTimeout(() => {
                        setMode(false);
                    }, 1200);

                    return;
                }

                // ĐĂNG NHẬP THÀNH CÔNG
                const accessToken = result.data?.accessToken;
                const user = result.data?.user;

                if (!accessToken || !user) {
                    throw new Error(
                        "Backend không trả về accessToken hoặc user."
                    );
                }

                API.setAuthSession(accessToken, user);

                const savedToken = localStorage.getItem(
                    "jobportal_access_token"
                );

                const savedSession = localStorage.getItem(
                    "jobportal_session"
                );

                if (!savedToken || !savedSession) {
                    throw new Error(
                        "Không thể lưu phiên đăng nhập vào trình duyệt."
                    );
                }

                showMessage("Đăng nhập thành công!", true);

                let destination = "./index.html";

                if (user.role === "admin") {
                    destination = "./admin-portal.html";
                } else if (user.role === "employer") {
                    destination = "./employer-dashboard.html";
                }

                setTimeout(() => {
                    window.location.assign(destination);
                }, 500);

            } catch (error) {
                console.error("Lỗi xác thực JobPortal:", error);

                showMessage(
                    error.message ||
                    "Không thể kết nối đến máy chủ Backend."
                );

            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = isRegister
                        ? "Tạo tài khoản"
                        : "Đăng nhập";
                }
            }
        });
    }

    // =========================================
    // KHỞI TẠO
    // =========================================

    const params = new URLSearchParams(window.location.search);
    setMode(params.get("mode") === "register");
});
