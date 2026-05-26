document.addEventListener("DOMContentLoaded", () => {
    // Determine language
    let lang = localStorage.getItem("lang") || "en";
    
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
    
    applyLangStyles(lang);
    
    // Fetch translations
    const loadTranslations = (currentLang) => {
        fetch(`/static/js/translations_${currentLang}.json`)
            .then(res => res.json())
            .then(translations => {
                window.translations = translations;
                // Translate all elements with data-translate attribute
                document.querySelectorAll("[data-translate]").forEach(el => {
                    const key = el.getAttribute("data-translate");
                    if (translations[key]) {
                        if (el.tagName === "INPUT" && el.placeholder !== undefined) {
                            el.placeholder = translations[key];
                        } else {
                            // Keep any icons inside the element if they exist
                            const icon = el.querySelector("i, span.glyphicon");
                            if (icon) {
                                // Preserve icon tag structure
                                const iconClone = icon.cloneNode(true);
                                el.innerHTML = "";
                                el.appendChild(iconClone);
                                el.appendChild(document.createTextNode(" " + translations[key]));
                            } else {
                                el.textContent = translations[key];
                            }
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
    
    loadTranslations(lang);
    
    // Bind click event to lang-switcher button
    const switcher = document.getElementById("lang-switcher");
    if (switcher) {
        switcher.addEventListener("click", () => {
            const nextLang = lang === "fa" ? "en" : "fa";
            localStorage.setItem("lang", nextLang);
            lang = nextLang;
            applyLangStyles(lang);
            loadTranslations(lang);
            // Refresh tables or UI components if needed
            if (typeof sf !== "undefined" && typeof sf.log === "function") {
                sf.log("Language changed to: " + lang);
            }
        });
    }
});
