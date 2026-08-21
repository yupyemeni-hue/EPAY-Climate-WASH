/* =========================================================
   EPAY — CORE APPLICATION
========================================================= */

"use strict";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeLoader();

    initializeHeader();

    initializeMobileNavigation();

    initializeLanguageToggle();

    initializeSmoothNavigation();

    initializeCurrentYear();

    initializeMapPreview();

});


/* =========================================================
   PAGE LOADER
========================================================= */

function initializeLoader() {

    const loader = document.getElementById("pageLoader");

    if (!loader) {
        return;
    }

    window.addEventListener("load", () => {

        window.setTimeout(() => {

            loader.classList.add("loaded");

            loader.setAttribute(
                "aria-hidden",
                "true"
            );

        }, 350);

    });

}


/* =========================================================
   HEADER SCROLL STATE
========================================================= */

function initializeHeader() {

    const header =
        document.getElementById("siteHeader");

    if (!header) {
        return;
    }


    const updateHeader = () => {

        if (window.scrollY > 20) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    };


    updateHeader();

    window.addEventListener(
        "scroll",
        updateHeader,
        { passive: true }
    );

}


/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function initializeMobileNavigation() {

    const menuButton =
        document.getElementById("menuToggle");

    const navigation =
        document.getElementById("mainNav");

    if (!menuButton || !navigation) {
        return;
    }


    const closeMenu = () => {

        menuButton.classList.remove("active");

        navigation.classList.remove("open");

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "menu-open"
        );

    };


    menuButton.addEventListener(
        "click",
        () => {

            const isOpen =
                navigation.classList.toggle("open");

            menuButton.classList.toggle(
                "active",
                isOpen
            );

            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            document.body.classList.toggle(
                "menu-open",
                isOpen
            );

        }
    );


    navigation
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                closeMenu
            );

        });


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                navigation.classList.contains("open")
            ) {

                closeMenu();

                menuButton.focus();

            }

        }
    );

}


/* =========================================================
   LANGUAGE TOGGLE — FOUNDATION
   =========================================================

   The full bilingual content system will be added in the
   internationalization stage. For this foundation, the
   button is intentionally non-destructive.
========================================================= */

function initializeLanguageToggle() {

    const button =
        document.getElementById("languageToggle");

    const label =
        document.getElementById("languageLabel");

    if (!button || !label) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            const current =
                document.documentElement
                    .getAttribute("lang") || "ar";


            /*
             * Do not switch the page to a missing language
             * file at this stage.
             *
             * The complete Arabic/English localization
             * engine will be implemented before release.
             */

            if (current === "ar") {

                label.textContent = "EN";

                button.setAttribute(
                    "aria-label",
                    "English version — coming in localization stage"
                );

            } else {

                label.textContent = "AR";

                button.setAttribute(
                    "aria-label",
                    "النسخة العربية — قيد التطوير"
                );

            }

        }
    );

}


/* =========================================================
   SMOOTH NAVIGATION
========================================================= */

function initializeSmoothNavigation() {

    const links =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    links.forEach(link => {

        link.addEventListener(
            "click",
            event => {

                const targetId =
                    link.getAttribute("href");


                if (
                    !targetId ||
                    targetId === "#"
                ) {
                    return;
                }


                const target =
                    document.querySelector(targetId);


                if (!target) {
                    return;
                }


                event.preventDefault();


                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            }
        );

    });

}


/* =========================================================
   CURRENT YEAR
========================================================= */

function initializeCurrentYear() {

    const yearElement =
        document.getElementById("currentYear");

    if (!yearElement) {
        return;
    }

    yearElement.textContent =
        new Date().getFullYear();

}


/* =========================================================
   MAP PREVIEW
========================================================= */

function initializeMapPreview() {

    const button =
        document.getElementById("mapComingSoon");

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            /*
             * The actual interactive risk map does not exist
             * yet. Do not fabricate a map or fake data.
             *
             * The button communicates the next platform
             * module while the map engine is being built.
             */

            showPlatformNotice(
                "خريطة المخاطر قيد البناء",
                "سيتم ربطها ببيانات جغرافية ومناخية فعلية في المرحلة التالية."
            );

        }
    );

}


/* =========================================================
   PLATFORM NOTICE
========================================================= */

function showPlatformNotice(
    title,
    message
) {

    const existing =
        document.querySelector(
            ".epay-notice"
        );


    if (existing) {
        existing.remove();
    }


    const notice =
        document.createElement("div");

    notice.className =
        "epay-notice";


    notice.innerHTML = `
        <div class="epay-notice-content">
            <button
                type="button"
                class="epay-notice-close"
                aria-label="إغلاق">
                ×
            </button>

            <div class="epay-notice-icon">
                EPAY
            </div>

            <div>
                <strong>${escapeHTML(title)}</strong>
                <p>${escapeHTML(message)}</p>
            </div>
        </div>
    `;


    document.body.appendChild(notice);


    requestAnimationFrame(() => {

        notice.classList.add("visible");

    });


    const closeButton =
        notice.querySelector(
            ".epay-notice-close"
        );


    const closeNotice = () => {

        notice.classList.remove("visible");

        window.setTimeout(
            () => notice.remove(),
            220
        );

    };


    closeButton.addEventListener(
        "click",
        closeNotice
    );


    window.setTimeout(
        closeNotice,
        5000
    );

}


/* =========================================================
   BASIC HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   NOTICE STYLES
   Injected here so the foundation requires no extra file.
========================================================= */

const noticeStyle =
    document.createElement("style");

noticeStyle.textContent = `

    .epay-notice {

        position: fixed;

        right: 20px;

        bottom: 20px;

        z-index: 9998;

        width: min(
            calc(100% - 40px),
            390px
        );

        padding: 14px;

        border:
            1px solid rgba(255,255,255,.10);

        border-radius: 16px;

        background:
            rgba(5,44,34,.97);

        color: white;

        box-shadow:
            0 25px 60px rgba(0,0,0,.25);

        opacity: 0;

        transform:
            translateY(15px);

        transition:
            opacity 220ms ease,
            transform 220ms ease;

    }


    .epay-notice.visible {

        opacity: 1;

        transform:
            translateY(0);

    }


    .epay-notice-content {

        display: flex;

        align-items: flex-start;

        gap: 12px;

    }


    .epay-notice-icon {

        width: 40px;

        height: 40px;

        display: grid;

        place-items: center;

        flex-shrink: 0;

        border-radius: 10px;

        background:
            rgba(19,150,106,.20);

        color:
            #69dbaa;

        font-family: "Inter", sans-serif;

        font-size: .52rem;

        font-weight: 800;

    }


    .epay-notice strong {

        display: block;

        margin-top: 1px;

        font-size: .72rem;

    }


    .epay-notice p {

        margin: 4px 0 0;

        color:
            rgba(255,255,255,.55);

        font-size: .61rem;

        line-height: 1.7;

    }


    .epay-notice-close {

        position: absolute;

        top: 8px;

        left: 9px;

        width: 24px;

        height: 24px;

        border: 0;

        background: transparent;

        color:
            rgba(255,255,255,.45);

        font-size: 1rem;

        line-height: 1;

    }


    .epay-notice-close:hover {

        color: white;

    }

`;


document.head.appendChild(noticeStyle);
/* ============================================================
   EPAY — Live Weather Provider Bootstrap
   Version: 1.0.0

   Purpose:
   - Verify that the live weather connector loads correctly
   - Test Open-Meteo connectivity
   - Keep the test isolated from the main UI
   - Do not fabricate or display data
   ============================================================ */

(function (window) {
    "use strict";

    function runWeatherProviderHealthCheck() {

        if (
            !window.EPAYWeather ||
            typeof window.EPAYWeather.healthCheck !==
                "function"
        ) {
            console.warn(
                "[EPAY] Weather provider is not loaded."
            );

            return;
        }

        window.EPAYWeather
            .healthCheck()
            .then(function (result) {

                if (result.online) {

                    console.info(
                        "[EPAY] Open-Meteo connection: ONLINE"
                    );

                    console.info(
                        "[EPAY] Response time:",
                        result.responseTimeMs,
                        "ms"
                    );

                } else {

                    console.warn(
                        "[EPAY] Open-Meteo connection: OFFLINE",
                        result
                    );

                }

            })
            .catch(function (error) {

                console.error(
                    "[EPAY] Weather health check failed:",
                    error
                );

            });

    }

    window.EPAYRunWeatherHealthCheck =
        runWeatherProviderHealthCheck;

})(window);
