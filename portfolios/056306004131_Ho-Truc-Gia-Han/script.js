
document.addEventListener("DOMContentLoaded", function () {
    // Khong chay hieu ung neu nguoi dung chon giam chuyen dong
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    // 1. Hieu ung trai tim bay
    if (!reduceMotion) {
        const symbols = ["♡", "♥", "✧", "✿"];
        const container = document.createElement("div");

        container.className = "floating-decorations";

        Object.assign(container.style, {
            position: "fixed",
            inset: "0",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: "4"
        });

        document.body.appendChild(container);

        const style = document.createElement("style");

        style.textContent = `
            .floating-decoration {
                position: absolute;
                bottom: -35px;
                color: #e875a7;
                opacity: 0;
                animation: decoration-fly linear forwards;
            }

            @keyframes decoration-fly {
                0% {
                    transform: translateY(0) rotate(0deg);
                    opacity: 0;
                }

                15% {
                    opacity: 0.65;
                }

                100% {
                    transform: translateY(-105vh) rotate(35deg);
                    opacity: 0;
                }
            }
        `;

        document.head.appendChild(style);

        function createDecoration() {
            const item = document.createElement("span");

            item.className = "floating-decoration";
            item.textContent =
                symbols[Math.floor(Math.random() * symbols.length)];

            item.style.left = Math.random() * 100 + "vw";
            item.style.fontSize =
                (14 + Math.random() * 14) + "px";

            item.style.animationDuration =
                (6 + Math.random() * 4) + "s";

            container.appendChild(item);

            item.addEventListener("animationend", function () {
                item.remove();
            });
        }

        // Tao bieu tuong moi moi 1 giay
        setInterval(function () {
            if (container.childElementCount < 10) {
                createDecoration();
            }
        }, 1000);
    }

    // 2. Hien cac muc noi dung khi cuon den
    const sections = document.querySelectorAll(
        ".content-section, .goal-section"
    );

    if ("IntersectionObserver" in window && !reduceMotion) {
        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12
            }
        );

        sections.forEach(function (section) {
            section.classList.add("reveal");
            observer.observe(section);
        });
    } else {
        sections.forEach(function (section) {
            section.classList.add("visible");
        });
    }
});
