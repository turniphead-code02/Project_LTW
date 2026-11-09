
// TOAST NOTIFICATION SYSTEM

(function () {
    function createToastContainer() {
        let container = document.querySelector(".toast-container");

        if (!container) {
            container = document.createElement("div");
            container.className = "toast-container";
            container.setAttribute("aria-live", "polite");
            container.setAttribute("aria-atomic", "false");
            document.body.appendChild(container);
        }

        return container;
    }

    window.showToast = function (
        message,
        type = "success",
        duration = 4000
    ) {
        const settings = {
            success: {
                icon: '<i class="fa-solid fa-circle-check"></i>',
                title: "Thành công"
            },
            error: {
                icon: '<i class="fa-solid fa-circle-xmark"></i>',
                title: "Đã xảy ra lỗi"
            },
            warning: {
                icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
                title: "Cảnh báo"
            },
            info: {
                icon: '<i class="fa-solid fa-circle-info"></i>',
                title: "Thông báo"
            }
        };

        const config = settings[type] || settings.info;
        const container = createToastContainer();

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        const icon = document.createElement("span");
        icon.className = "toast-icon";
        icon.innerHTML = config.icon;

        const content = document.createElement("div");
        content.className = "toast-content";

        const title = document.createElement("div");
        title.className = "toast-title";
        title.textContent = config.title;

        const text = document.createElement("div");
        text.className = "toast-message";
        text.textContent = message;

        const progress = document.createElement("div");
        progress.className = "toast-progress";

        const progressBar = document.createElement("div");
        progressBar.className = "toast-progress-bar";

        progress.appendChild(progressBar);

        content.append(title, text, progress);

        const close = document.createElement("button");
        close.className = "toast-close";
        close.type = "button";
        close.textContent = "×";
        close.setAttribute("aria-label", "Đóng thông báo");

        toast.append(icon, content, close);
        container.appendChild(toast);

        let timeout;

        function removeToast() {
            if (toast.classList.contains("hide")) return;

            clearTimeout(timeout);
            toast.classList.add("hide");

            toast.addEventListener("animationend", function () {
                toast.remove();
            }, { once: true });
        }

        close.addEventListener("click", removeToast);

        if (duration > 0) {
            timeout = setTimeout(removeToast, duration);
        }

        return removeToast;
    };
})();
