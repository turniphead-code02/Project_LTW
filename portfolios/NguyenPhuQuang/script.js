
/* ========================================
   PORTFOLIO - NGUYỄN PHÚ QUANG
   JAVASCRIPT
======================================== */


/* ========================================
   1. DARK / LIGHT MODE
======================================== */

const themeButton = document.getElementById("theme-toggle");

if (themeButton) {

    function updateThemeButton() {

        const isLightMode = document.body.classList.contains("light-mode");

        themeButton.innerHTML = isLightMode
            ? '<i class="fa-solid fa-moon" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-sun" aria-hidden="true"></i>';

        themeButton.setAttribute(
            "aria-label",
            isLightMode
                ? "Chuyển sang giao diện tối"
                : "Chuyển sang giao diện sáng"
        );
    }

    try {
        const savedTheme = localStorage.getItem("portfolio-theme");

        if (savedTheme === "light") {
            document.body.classList.add("light-mode");
        }
    } catch (error) {
        // Dùng giao diện mặc định nếu không đọc được bộ nhớ
    }

    updateThemeButton();

    themeButton.addEventListener("click", function () {

        const isLightMode = document.body.classList.toggle("light-mode");

        updateThemeButton();

        try {
            localStorage.setItem(
                "portfolio-theme",
                isLightMode ? "light" : "dark"
            );
        } catch (error) {
            // Vẫn chuyển giao diện dù không lưu được
        }
    });
}


/* ========================================
   2. RESPONSIVE NAVBAR
======================================== */

const menuButton = document.getElementById("menu-toggle");
const navbar = document.getElementById("navbar");

if (menuButton && navbar) {

    function updateMenu(isOpen) {

        navbar.classList.toggle("active", isOpen);

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            isOpen ? "Đóng menu" : "Mở menu"
        );

        menuButton.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
            : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    }

    function closeMenu() {
        updateMenu(false);
    }

    menuButton.addEventListener("click", function () {

        const isOpen = !navbar.classList.contains("active");

        updateMenu(isOpen);
    });

    navbar.querySelectorAll(".nav-link").forEach(function (link) {

        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeMenu();
        }
    });

    document.addEventListener("click", function (event) {

        if (
            !navbar.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {
            closeMenu();
        }
    });

    window.addEventListener("resize", function () {

        if (window.innerWidth > 1100) {
            closeMenu();
        }
    });
}


/* ========================================
   3. SKILLS ACCORDION
======================================== */

const skillGroups = document.querySelectorAll(".skill-group");

skillGroups.forEach(function (currentGroup) {

    currentGroup.addEventListener("toggle", function () {

        if (!currentGroup.open) {
            return;
        }

        skillGroups.forEach(function (otherGroup) {

            if (otherGroup !== currentGroup) {
                otherGroup.open = false;
            }
        });
    });
});


/* ========================================
   4. FONT SIZE CONTROL
======================================== */

const fontToggle = document.getElementById("font-toggle");
const fontPanel = document.getElementById("font-panel");
const fontSlider = document.getElementById("font-slider");
const fontValue = document.getElementById("font-value");
const fontReset = document.getElementById("font-reset");

const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 24;

if (
    fontToggle &&
    fontPanel &&
    fontSlider &&
    fontValue &&
    fontReset
) {

    // Mở hoặc đóng bảng điều chỉnh
    function setFontPanelOpen(isOpen) {

        fontPanel.hidden = !isOpen;

        fontToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );
    }

    // Cập nhật kích thước chữ
    function updateFontSize(size) {

        const numericSize = Number(size);

        const newSize = Math.min(
            MAX_FONT_SIZE,
            Math.max(
                MIN_FONT_SIZE,
                Number.isFinite(numericSize)
                    ? numericSize
                    : DEFAULT_FONT_SIZE
            )
        );

        // Tỷ lệ phóng to chữ so với mặc định
        const scale = newSize / DEFAULT_FONT_SIZE;

        document.documentElement.style.setProperty(
            "--font-scale",
            String(scale)
        );

        fontSlider.value = String(newSize);

        fontValue.textContent = newSize + "px";

        fontSlider.setAttribute(
            "aria-valuetext",
            newSize + " pixel"
        );
    }

    // Nhấn nút Aa
    fontToggle.addEventListener("click", function () {

        setFontPanelOpen(fontPanel.hidden);
    });

    // Kéo thanh trượt
    fontSlider.addEventListener("input", function () {

        updateFontSize(fontSlider.value);
    });

    // Khôi phục mặc định
    fontReset.addEventListener("click", function () {

        updateFontSize(DEFAULT_FONT_SIZE);
    });

    // Nhấn bên ngoài thì đóng bảng
    document.addEventListener("click", function (event) {

        const clickedToggle = fontToggle.contains(event.target);
        const clickedPanel = fontPanel.contains(event.target);

        if (!clickedToggle && !clickedPanel) {
            setFontPanelOpen(false);
        }
    });

    // Nhấn Escape để đóng bảng
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && !fontPanel.hidden) {

            setFontPanelOpen(false);
            fontToggle.focus();
        }
    });

    // Tải lại trang luôn về mặc định
    updateFontSize(DEFAULT_FONT_SIZE);
    setFontPanelOpen(false);
}


/* ========================================
   5. MATRIX BINARY BACKGROUND
   SỐ 0 & 1 RƠI NHẸ NHÀNG
======================================== */

const binaryCanvas = document.getElementById("binary-background");

if (binaryCanvas) {

    const ctx = binaryCanvas.getContext("2d");

    if (ctx) {

        /* ====================================
           CẤU HÌNH HIỆU ỨNG
        ==================================== */

        // Kích thước chữ 0 và 1
        const fontSize = 15;

        // Khoảng cách giữa các cột
        const spacing = 42;

        // Khoảng cách giữa các số trong một cột
        const digitSpacing = 28;

        // Tốc độ rơi (pixel / giây)
        const minSpeed = 12;
        const maxSpeed = 26;

        // Số lượng ký tự trong mỗi cột
        const minLength = 4;
        const maxLength = 9;

        // Giới hạn khoảng 20 FPS
        const frameInterval = 1000 / 20;

        // Danh sách các cột số
        const streams = [];

        // Kiểm tra tùy chọn giảm chuyển động
        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        );

        let canvasWidth = 0;
        let canvasHeight = 0;

        let animationId = null;
        let lastFrame = 0;

        /* ====================================
           TẠO CÁC CỘT SỐ
        ==================================== */

        function resizeBinaryCanvas() {

            const pixelRatio = Math.min(
                window.devicePixelRatio || 1,
                2
            );

            canvasWidth = window.innerWidth;
            canvasHeight = window.innerHeight;

            // Độ phân giải thực của Canvas
            binaryCanvas.width = Math.round(
                canvasWidth * pixelRatio
            );

            binaryCanvas.height = Math.round(
                canvasHeight * pixelRatio
            );

            // Giữ tọa độ vẽ theo pixel CSS
            ctx.setTransform(
                pixelRatio,
                0,
                0,
                pixelRatio,
                0,
                0
            );

            // Xóa danh sách cột cũ
            streams.length = 0;

            // Tạo số lượng cột theo chiều rộng màn hình
            const count = Math.ceil(
                canvasWidth / spacing
            );

            for (let i = 0; i < count; i++) {

                const randomSpeed =
                    minSpeed +
                    Math.random() * (maxSpeed - minSpeed);

                const randomLength =
                    minLength +
                    Math.floor(
                        Math.random() *
                        (maxLength - minLength + 1)
                    );

                streams.push({

                    // Vị trí ngang
                    x: i * spacing + Math.random() * 10,

                    // Vị trí dọc ban đầu
                    y: Math.random() * canvasHeight,

                    // Tốc độ rơi
                    speed: randomSpeed,

                    // Chiều dài cột
                    length: randomLength,

                    // Dãy số của cột
                    digits: Array.from(
                        { length: randomLength },
                        function () {
                            return Math.random() > 0.5
                                ? "1"
                                : "0";
                        }
                    )
                });
            }
        }

        /* ====================================
           VẼ CÁC SỐ 0 VÀ 1
        ==================================== */

        function drawBinary(timestamp) {

            animationId = requestAnimationFrame(drawBinary);

            // Giới hạn FPS
            const elapsed = timestamp - lastFrame;

            if (elapsed < frameInterval) {
                return;
            }

            lastFrame = timestamp - (elapsed % frameInterval);

            // Xóa khung hình trước, giữ Canvas trong suốt
            ctx.clearRect(
                0,
                0,
                canvasWidth,
                canvasHeight
            );

            ctx.font = fontSize + "px monospace";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";

            // Thời gian giữa các khung hình (giây)
            const deltaTime = Math.min(
                elapsed / 1000,
                0.1
            );

            // Kiểm tra chế độ sáng / tối
            const isLightMode = document.body.classList.contains(
                "light-mode"
            );

            streams.forEach(function (stream) {

                // Cho cột số rơi xuống
                stream.y += stream.speed * deltaTime;

                // Vẽ từng số trong cột
                for (let i = 0; i < stream.length; i++) {

                    const y = stream.y - i * digitSpacing;

                    // Không vẽ số nằm ngoài màn hình
                    if (
                        y < -fontSize ||
                        y > canvasHeight
                    ) {
                        continue;
                    }

                    // Số phía trên mờ dần
                    const alpha =
                        0.9 * (1 - i / stream.length);

                    // Dark Mode: xanh neon
                    // Light Mode: xanh lá đậm
                    ctx.fillStyle = isLightMode
                        ? "rgba(0, 110, 45, " + alpha + ")"
                        : "rgba(0, 255, 70, " + alpha + ")";

                    ctx.fillText(
                        stream.digits[i],
                        stream.x,
                        y
                    );
                }

                // Khi cột rơi hết màn hình
                // đưa cột về phía trên
                if (
                    stream.y -
                    stream.length * digitSpacing >
                    canvasHeight
                ) {

                    stream.y =
                        -Math.random() * canvasHeight;

                    // Tạo dãy số mới
                    stream.digits = Array.from(
                        { length: stream.length },
                        function () {
                            return Math.random() > 0.5
                                ? "1"
                                : "0";
                        }
                    );
                }
            });
        }

        /* ====================================
           QUẢN LÝ CHUYỂN ĐỘNG
        ==================================== */

        function stopBinaryAnimation() {

            if (animationId !== null) {

                cancelAnimationFrame(animationId);

                animationId = null;
            }
        }

        function startBinaryAnimation() {

            // Không chạy khi người dùng giảm chuyển động
            // hoặc đang ở tab khác
            if (
                reducedMotion.matches ||
                document.hidden
            ) {
                return;
            }

            // Tránh tạo nhiều vòng lặp cùng lúc
            if (animationId !== null) {
                return;
            }

            lastFrame = 0;

            animationId = requestAnimationFrame(
                drawBinary
            );
        }

        /* ====================================
           KHỞI TẠO
        ==================================== */

        resizeBinaryCanvas();

        startBinaryAnimation();

        // Cập nhật Canvas khi đổi kích thước màn hình
        window.addEventListener(
            "resize",
            resizeBinaryCanvas
        );

        // Dừng khi chuyển tab, chạy lại khi quay về
        document.addEventListener(
            "visibilitychange",
            function () {

                if (document.hidden) {

                    stopBinaryAnimation();

                } else {

                    startBinaryAnimation();
                }
            }
        );

        // Tôn trọng cài đặt giảm chuyển động
        function handleReducedMotionChange() {

            if (reducedMotion.matches) {

                stopBinaryAnimation();

                ctx.clearRect(
                    0,
                    0,
                    canvasWidth,
                    canvasHeight
                );

            } else {

                startBinaryAnimation();
            }
        }

        if (reducedMotion.addEventListener) {

            reducedMotion.addEventListener(
                "change",
                handleReducedMotionChange
            );

        } else if (reducedMotion.addListener) {

            reducedMotion.addListener(
                handleReducedMotionChange
            );
        }
    }
}

/* ===== CONTACT FORM MODAL ===== */

document.addEventListener("DOMContentLoaded", () => {
    const openBtn = document.getElementById("contact-form-open");
    const closeBtn = document.getElementById("contact-form-close");
    const modal = document.getElementById("contact-modal");
    const modalBox = modal?.querySelector(".contact-modal-box");
    const form = document.getElementById("contact-form");
    const status = document.getElementById("contact-form-status");

    if (!openBtn || !closeBtn || !modal || !form || !status) {
        return;
    }

    let previousFocus = null;

    function openModal() {
        previousFocus = document.activeElement;
        modal.hidden = false;
        document.getElementById("contact-name").focus();
    }

    function closeModal() {
        modal.hidden = true;
        previousFocus?.focus();
    }

    openBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (modal.hidden) return;

        if (event.key === "Escape") {
            closeModal();
        }

        if (event.key === "Tab") {
            const focusable = Array.from(
                modalBox.querySelectorAll(
                    'button, input, textarea, a[href]'
                )
            ).filter(el => !el.disabled);

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === last
            ) {
                event.preventDefault();
                first.focus();
            }
        }
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const name = document.getElementById("contact-name").value.trim();
        const email = document.getElementById("contact-email").value.trim();
        const message = document.getElementById("contact-message").value.trim();

        status.style.color = "#ef4444";

        if (!name || !email || !message) {
            status.textContent = "Vui lòng điền đầy đủ thông tin.";
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            status.textContent = "Email không đúng định dạng.";
            return;
        }

        if (message.length < 10) {
            status.textContent = "Nội dung cần ít nhất 10 ký tự.";
            return;
        }

        status.style.color = "#22c55e";
        status.textContent =
            "Thông tin hợp lệ! Form đã được kiểm tra thành công.";

        // Chưa gửi dữ liệu đến email hoặc máy chủ.
    });
});
