
const menuBtn = document.getElementById("menuBtn");
const nav = document.querySelector(".nav");

if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
        nav.classList.toggle("active");
    });

    nav.addEventListener("mouseleave", function () {
        nav.classList.remove("active");
    });

    const navLinks = nav.querySelectorAll("a");

    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            nav.classList.remove("active");
        });
    });
}

const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                    revealObserver.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.15
        }
    );

    revealElements.forEach(function (element) {
        revealObserver.observe(element);
    });
} else {
    revealElements.forEach(function (element) {
        element.classList.add("show");
    });
}

const themeBtn = document.getElementById("themeBtn");
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
}

function updateThemeButton() {
    if (!themeBtn) return;

    const isDark = document.body.classList.contains("dark-mode");

    themeBtn.textContent = isDark ? "☀️" : "🌙";

    themeBtn.setAttribute(
        "aria-label",
        isDark
            ? "Chuyển sang giao diện sáng"
            : "Chuyển sang giao diện tối"
    );
}

updateThemeButton();

if (themeBtn) {
    themeBtn.addEventListener("click", function () {
        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");

        localStorage.setItem("theme", isDark ? "dark" : "light");

        updateThemeButton();

        themeBtn.classList.remove("theme-animate");
        void themeBtn.offsetWidth;
        themeBtn.classList.add("theme-animate");
    });

    themeBtn.addEventListener("animationend", function () {
        themeBtn.classList.remove("theme-animate");
    });
}

const skillBars = document.querySelectorAll(".skill-progress-bar");

if ("IntersectionObserver" in window) {
    const skillObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const level = bar.dataset.level;

                    bar.style.width = level + "%";

                    skillObserver.unobserve(bar);
                }
            });
        },
        {
            threshold: 0.3
        }
    );

    skillBars.forEach(function (bar) {
        skillObserver.observe(bar);
    });
} else {
    skillBars.forEach(function (bar) {
        bar.style.width = bar.dataset.level + "%";
    });
}

const projectDetailBtn = document.getElementById("projectDetailBtn");
const projectModal = document.getElementById("projectModal");
const closeProjectModal = document.getElementById("closeProjectModal");
const modalContactBtn = document.getElementById("modalContactBtn");

function openProjectModal() {
    if (!projectModal) return;

    projectModal.hidden = false;
    projectModal.setAttribute("aria-hidden", "false");

    requestAnimationFrame(function () {
        projectModal.classList.add("active");
    });

    document.body.style.overflow = "hidden";
    closeProjectModal.focus();
}

function closeModal() {
    if (!projectModal) return;

    projectModal.classList.remove("active");
    projectModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    setTimeout(function () {
        projectModal.hidden = true;
    }, 300);

    if (projectDetailBtn) {
        projectDetailBtn.focus();
    }
}

if (projectDetailBtn && projectModal && closeProjectModal) {
    projectDetailBtn.addEventListener("click", openProjectModal);

    closeProjectModal.addEventListener("click", closeModal);

    projectModal.addEventListener("click", function (event) {
        if (event.target === projectModal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            !projectModal.hidden
        ) {
            closeModal();
        }
    });
}

if (modalContactBtn) {
    modalContactBtn.addEventListener("click", function () {
        closeModal();
        window.location.hash = "contact";
    });
}

const backToTop = document.getElementById("backToTop");

if (backToTop) {
    window.addEventListener("scroll", function () {
        if (window.scrollY > 300) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    });

    backToTop.addEventListener("click", function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}

const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

if (contactForm && formStatus) {
    contactForm.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        formStatus.textContent =
            "Biểu mẫu hợp lệ! Hiện tại website chưa kết nối dịch vụ gửi email.";
        formStatus.className = "form-status success";

        contactForm.reset();
    });
}

const sections = document.querySelectorAll(
    "main section[id]"
);

const sectionNavLinks = document.querySelectorAll(
    ".nav a[href^='#']"
);

if ("IntersectionObserver" in window && sections.length > 0) {
    const activeSectionObserver = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const currentId = entry.target.id;

                    sectionNavLinks.forEach(function (link) {
                        const isActive =
                            link.getAttribute("href") === "#" + currentId;

                        link.classList.toggle("active", isActive);

                        if (isActive) {
                            link.setAttribute("aria-current", "location");
                        } else {
                            link.removeAttribute("aria-current");
                        }
                    });
                }
            });
        },
        {
            rootMargin: "-25% 0px -60% 0px",
            threshold: 0
        }
    );

    sections.forEach(function (section) {
        activeSectionObserver.observe(section);
    });
}
