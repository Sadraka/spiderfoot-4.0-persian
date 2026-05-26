// Determine language
let lang = localStorage.getItem("lang") || "fa";

// Function to apply language styling & direction
const applyLangStyles = (currentLang) => {
    if (currentLang === "fa") {
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "fa");
        document.body.classList.add("rtl-mode");
    } else {
        document.documentElement.setAttribute("dir", "ltr");
        document.documentElement.setAttribute("lang", "en");
        document.body.classList.remove("rtl-mode");
    }
};

window.translatePage = () => {
    let currentLang = localStorage.getItem("lang") || "fa";
    applyLangStyles(currentLang);

    fetch(`/static/js/translations_${currentLang}.json`)
        .then(res => res.json())
        .then(translations => {
            window.translations = translations;
            
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
                    } else {
                        // Keep any icons inside the element if they exist
                        const icon = el.querySelector("i, span.glyphicon");
                        if (icon) {
                            // Preserve icon tag structure
                            const iconClone = icon.cloneNode(true);
                            el.innerHTML = "";
                            el.appendChild(iconClone);
                            
                            const textSpan = document.createElement("span");
                            if (translations[key].indexOf("<") >= 0 || translations[key].indexOf("&") >= 0) {
                                textSpan.innerHTML = " " + translations[key];
                            } else {
                                textSpan.textContent = " " + translations[key];
                            }
                            el.appendChild(textSpan);
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

            // Update Lang Switcher Text
            const switcher = document.getElementById("lang-switcher");
            if (switcher) {
                switcher.textContent = currentLang === "fa" ? "English" : "فارسی";
            }
        })
        .catch(err => console.error("Error loading translations:", err));
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
