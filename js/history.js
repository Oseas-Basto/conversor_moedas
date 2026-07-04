/* ==========================================================
   Conversor de Moedas
   history.js
   Histórico de conversões no navegador
========================================================== */

const History = (() => {
    const STORAGE_KEY = "conversionHistory";
    const LIMIT = 10;

    function isStorageAvailable() {
        try {
            const testKey = "__storage_test__";

            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);

            return true;
        } catch {
            return false;
        }
    }

    function getAll() {
        if (!isStorageAvailable()) {
            return [];
        }

        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (!Array.isArray(data)) {
                return [];
            }

            return data;
        } catch {
            return [];
        }
    }

    function save(items) {
        if (!isStorageAvailable()) {
            return;
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(items)
        );
    }

    function createId() {
        if (crypto && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function normalizeItem(item = {}) {
        return {
            id: item.id || createId(),
            amount: String(item.amount ?? ""),
            from: String(item.from ?? "").toUpperCase(),
            to: String(item.to ?? "").toUpperCase(),
            result: String(item.result ?? ""),
            rate: String(item.rate ?? ""),
            date: item.date || new Date().toLocaleString("pt-BR")
        };
    }

    function add(item) {
        const normalized = normalizeItem(item);

        if (!normalized.amount || !normalized.from || !normalized.to || !normalized.result) {
            return null;
        }

        const items = getAll();

        const newList = [
            normalized,
            ...items
        ].slice(0, LIMIT);

        save(newList);
        render();

        return normalized;
    }

    function remove(id) {
        if (!id) return;

        const items = getAll().filter(item => item.id !== id);

        save(items);
        render();
    }

    function clear() {
        if (isStorageAvailable()) {
            localStorage.removeItem(STORAGE_KEY);
        }

        render();
    }

    function render() {
        if (typeof UI !== "undefined") {
            UI.renderHistory(getAll());
        }
    }

    function exportJSON() {
        const data = getAll();

        return JSON.stringify(data, null, 2);
    }

    function importJSON(json) {
        try {
            const data = JSON.parse(json);

            if (!Array.isArray(data)) {
                throw new Error("Formato inválido.");
            }

            const normalized = data
                .map(normalizeItem)
                .slice(0, LIMIT);

            save(normalized);
            render();

            return true;
        } catch {
            return false;
        }
    }

    function init() {
        render();
    }

    return {
        getAll,
        add,
        remove,
        clear,
        render,
        exportJSON,
        importJSON,
        init
    };
})();