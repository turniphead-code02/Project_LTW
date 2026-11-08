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

let isRegister = false;


function setMode(register) {
    isRegister = register;

    nameGroup.hidden = !register;
    confirmGroup.hidden = !register;
    roleGroup.hidden = !register;
    strengthGroup.hidden = !register;
    loginOptions.hidden = register;

    loginTab.classList.toggle("active", !register);
    registerTab.classList.toggle("active", register);

    formTitle.textContent = register
        ? "Tạo tài khoản mới"
        : "Chào mừng trở lại!";

    formDescription.textContent = register
        ? "Đăng ký để bắt đầu sử dụng JobPortal."
        : "Đăng nhập để tiếp tục sử dụng JobPortal.";

    submitButton.textContent = register
        ? "Tạo tài khoản"
        : "Đăng nhập";

    switchText.textContent = register
        ? "Đã có tài khoản?"
        : "Chưa có tài khoản?";

    switchButton.textContent = register
        ? "Đăng nhập ngay"
        : "Đăng ký ngay";

    formMessage.textContent = "";
    clearErrors();
}

loginTab.addEventListener("click", () => setMode(false));
registerTab.addEventListener("click", () => setMode(true));
switchButton.addEventListener("click", () => setMode(!isRegister));


function clearErrors() {
    document.querySelectorAll(".error-message").forEach(item => {
        item.textContent = "";
    });

    document.querySelectorAll(".form-group input").forEach(input => {
        input.classList.remove("invalid");
    });
}


function showError(input, message) {
    input.classList.add("invalid");

    const error = input.parentElement.querySelector(".error-message");

    if (error) {
        error.textContent = message;
    }
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

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

    document.getElementById("strengthText").textContent =
        "Độ mạnh: " + labels[score];

    return score;
}

password.addEventListener("input", () => {
    if (isRegister) {
        checkPasswordStrength(password.value);
    }
});

// Kiểm tra biểu mẫu
function validateForm() {
    clearErrors();

    let valid = true;

    if (isRegister && fullName.value.trim().length < 2) {
        showError(fullName, "Vui lòng nhập họ tên hợp lệ.");
        valid = false;
    }

    if (!isValidEmail(email.value.trim())) {
        showError(email, "Email không đúng định dạng.");
        valid = false;
    }

    if (password.value.length < 8) {
        showError(password, "Mật khẩu phải có ít nhất 8 ký tự.");
        valid = false;
    }

    if (isRegister) {
        if (checkPasswordStrength(password.value) < 3) {
            showError(password, "Mật khẩu cần mạnh hơn.");
            valid = false;
        }

        if (password.value !== confirmPassword.value) {
            showError(confirmPassword, "Mật khẩu xác nhận không khớp.");
            valid = false;
        }
    }

    return valid;
}

authForm.addEventListener("submit", function(event) {
    event.preventDefault();

    formMessage.textContent = "";
    formMessage.classList.remove("success");

    if (!validateForm()) {
        formMessage.textContent =
            "Vui lòng kiểm tra lại thông tin.";
        return;
    }

    formMessage.textContent = isRegister
        ? "Thông tin hợp lệ! Chức năng đăng ký sẽ được kết nối API ở bước tiếp theo."
        : "Thông tin hợp lệ! Chức năng đăng nhập sẽ được kết nối API ở bước tiếp theo.";

    formMessage.classList.add("success");
});


setMode(false);
