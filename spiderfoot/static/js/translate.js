// Global translation helper
window.t = (key, defaultText) => (window.translations && window.translations[key]) ? window.translations[key] : defaultText;

// Translate backend error messages
window.translateError = (msg) => {
    if (!msg) return msg;
    if (!window.translations) return msg;

    const errorsMap = {
        "Scan ID not found.": "error_scan_id_not_found",
        "Invalid export filetype.": "error_invalid_export_filetype",
        "Invalid scan ID.": "error_invalid_scan_id",
        "Something went wrong internally.": "error_something_went_wrong_internally",
        "Invalid target type. Could not recognize it as a target SpiderFoot supports.": "error_invalid_target_type",
        "Failed to reset settings": "error_failed_reset_settings",
        "Invalid request: scan name was not specified.": "error_scan_name_not_specified",
        "Invalid request: scan target was not specified.": "error_scan_target_not_specified",
        "Invalid request: no modules specified for scan.": "error_no_modules_specified"
    };

    const key = errorsMap[msg.trim()];
    if (key && window.translations[key]) {
        return window.translations[key];
    }

    // Dynamic matches
    if (msg.indexOf("Invalid scan ID:") >= 0) {
        const id = msg.split(":")[1] || "";
        return (window.translations["error_invalid_scan_id_dynamic"] || "شناسه اسکن نامعتبر است: {id}").replace("{id}", id);
    }
    if (msg.indexOf("failed:") >= 0) {
        const detail = msg.split("failed:")[1] || "";
        return (window.translations["error_scan_failed_dynamic"] || "اسکن با خطا مواجه شد: {detail}").replace("{detail}", detail);
    }
    if (msg.indexOf("Invalid token") >= 0) {
        return window.translations["error_invalid_token"] || "توکن نامعتبر است";
    }

    return msg;
};

// Determine language
let lang = localStorage.getItem("lang") || "fa";

// Function to apply language styling & direction
const applyLangStyles = (currentLang) => {
    const footerPersian = document.getElementById('footer-persian');
    const footerEnglish = document.getElementById('footer-english');
    if (currentLang === "fa") {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "fa");
        document.body.classList.add("rtl-mode");
        if (footerPersian) footerPersian.style.display = 'inline';
        if (footerEnglish) footerEnglish.style.order = '2';
    } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.documentElement.setAttribute("lang", "en");
        document.body.classList.remove("rtl-mode");
        if (footerPersian) footerPersian.style.display = 'none';
        if (footerEnglish) footerEnglish.style.order = '';
    }
};

window.translatePage = () => {
    let currentLang = localStorage.getItem("lang") || "fa";
    applyLangStyles(currentLang);

    window.translationPromise = fetch(`/static/js/translations_${currentLang}.json`)
        .then(res => res.json())
        .then(translations => {
            window.translations = translations;

            // Translate all elements with data-translate attribute
            // Translate all elements with data-translate attribute
            document.querySelectorAll("[data-translate]").forEach(el => {
                const key = el.getAttribute("data-translate");
                if (translations[key]) {
                    // Update attributes if they exist
                    if (el.getAttribute("data-title")) {
                        el.setAttribute("data-title", translations[key + "_title"] || translations[key]);
                    }
                    if (el.getAttribute("title")) {
                        el.setAttribute("title", translations[key + "_title"] || translations[key]);
                    }
                    if (el.getAttribute("data-content")) {
                        el.setAttribute("data-content", translations[key + "_content"] || translations[key]);
                    }

                    if (el.tagName === "INPUT" && el.placeholder !== undefined) {
                        el.placeholder = translations[key];
                    } else if (el.tagName === "OPTION") {
                        el.textContent = translations[key];
                    } else if (el.getAttribute("data-toggle") === "popover") {
                        // --- تغییر مهم اینجاست ---
                        // اگر المان یک پاپ‌اور هاور است، نباید متن ترجمه را داخل ساختار متنی خودش (innerHTML) بریزد.
                        // فقط اتریبیوت‌ها آپدیت می‌شوند که بالاتر انجام شد.
                        return;
                    } else {
                        // Keep any icons inside the element if they exist
                        const icon = el.querySelector("i, span.glyphicon");
                        if (icon) {
                            // Preserve icon tag structure
                            const iconClone = icon.cloneNode(true);
                            el.innerHTML = "";
                            const textSpan = document.createElement("span");
                            if (translations[key].indexOf("<") >= 0 || translations[key].indexOf("&") >= 0) {
                                textSpan.innerHTML = translations[key] + " ";
                            } else {
                                textSpan.textContent = translations[key] + " ";
                            }
                            el.appendChild(textSpan);
                            el.appendChild(iconClone);
                        } else {
                            if (translations[key].indexOf("<") >= 0 || translations[key].indexOf("&") >= 0) {
                                el.innerHTML = translations[key];
                            } else {
                                el.textContent = translations[key];
                            }
                        }
                    }
                }
            });
            // Translate opt descriptions
            document.querySelectorAll("[data-opt-key]").forEach(el => {
                const key = el.getAttribute("data-opt-key");
                if (translations[key]) {
                    if (translations[key].indexOf("<") >= 0 || translations[key].indexOf("&") >= 0) {
                        el.innerHTML = translations[key];
                    } else {
                        el.textContent = translations[key];
                    }
                }
            });

            // Translate main error page message if it exists
            const errorEl = document.getElementById("error-message");
            if (errorEl) {
                errorEl.textContent = window.translateError(errorEl.textContent);
            }

            // Update Lang Switcher Text
            const switcher = document.getElementById("lang-switcher");
            if (switcher) {
                switcher.textContent = currentLang === "fa" ? "English" : "فارسی";
            }

            // Update Theme Toggler Text
            if (typeof window.updateTogglerText === "function") {
                window.updateTogglerText();
            }

            // Translate Alertify buttons and set notifier position based on language
            if (typeof alertify !== 'undefined') {
                if (alertify.defaults && alertify.defaults.glossary) {
                    alertify.defaults.glossary.ok = translations["ok"] || (currentLang === "fa" ? "تایید" : "OK");
                    alertify.defaults.glossary.cancel = translations["cancel"] || (currentLang === "fa" ? "لغو" : "Cancel");
                }
                if (typeof alertify.set === 'function') {
                    alertify.set('notifier', 'position', currentLang === "fa" ? 'bottom-left' : 'bottom-right');
                }
            }
            
            // Show translated page
            document.documentElement.style.visibility = "visible";
        })
        .catch(err => {
            console.error("Error loading translations:", err);
            document.documentElement.style.visibility = "visible";
        });
};

document.addEventListener("DOMContentLoaded", () => {
    window.translatePage();

    // Bind click event to lang-switcher button
    const switcher = document.getElementById("lang-switcher");
    if (switcher) {
        switcher.addEventListener("click", () => {
            const nextLang = lang === "fa" ? "en" : "fa";
            localStorage.setItem("lang", nextLang);
            lang = nextLang;
            window.translatePage();

            // If the table rendering or UI update functions exist, call them to reload page layout
            if (typeof reload === "function") {
                reload();
            } else if (typeof refresh === "function") {
                refresh();
            } else {
                location.reload();
            }
        });
    }
});
