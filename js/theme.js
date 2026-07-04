/* ==========================================================
   Conversor de Moedas
   theme.js
   Tema claro/escuro
========================================================== */

const Theme = (() => {
    const STORAGE_KEY = "theme";
    const DARK_CLASS = "dark";

    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            // Ignora erro caso o navegador bloqueie localStorage.
        }
    }

    function prefersDark() {
        return window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function getSystemTheme() {
        return prefersDark() ? "dark" : "light";
    }

    function isDark() {
        return document.body.classList.contains(DARK_CLASS);
    }

    function updateMetaThemeColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');

        if (!meta) return;

        meta.setAttribute(
            "content",
            theme === "dark" ? "#111827" : "#0d6efd"
        );
    }

    function updateButton(theme) {
        const button = document.querySelector("#themeButton");

        if (!button) return;

        const dark = theme === "dark";

        button.textContent = dark ? "☀️" : "🌙";

        button.setAttribute(
            "aria-label",
            dark ? "Ativar tema claro" : "Ativar tema escuro"
        );

        button.setAttribute(
            "title",
            dark ? "Ativar tema claro" : "Ativar tema escuro"
        );
    }

    function apply(theme, shouldSave = true) {
        const selectedTheme = theme === "dark" ? "dark" : "light";

        if (selectedTheme === "dark") {
            document.body.classList.add(DARK_CLASS);
        } else {
            document.body.classList.remove(DARK_CLASS);
        }

        updateButton(selectedTheme);
        updateMetaThemeColor(selectedTheme);

        if (shouldSave) {
            saveTheme(selectedTheme);
        }
    }

    function toggle() {
        apply(isDark() ? "light" : "dark", true);
    }

    function watchSystemTheme() {
        if (!window.matchMedia) return;

        const media = window.matchMedia("(prefers-color-scheme: dark)");

        const handler = event => {
            const savedTheme = getSavedTheme();

            if (savedTheme) return;

            apply(event.matches ? "dark" : "light", false);
        };

        if (typeof media.addEventListener === "function") {
            media.addEventListener("change", handler);
        } else if (typeof media.addListener === "function") {
            media.addListener(handler);
        }
    }

    function bindEvents() {
        const button = document.querySelector("#themeButton");

        if (!button) return;

        button.addEventListener("click", toggle);
    }

    function init() {
        const savedTheme = getSavedTheme();

        if (savedTheme === "dark" || savedTheme === "light") {
            apply(savedTheme, false);
        } else {
            apply(getSystemTheme(), false);
        }

        bindEvents();
        watchSystemTheme();
    }

    return {
        init,
        apply,
        toggle,
        isDark,
        getSavedTheme
    };
})();