/* ==========================================================
   Conversor de Moedas
   favorites.js
   Pares de moedas favoritos no navegador
========================================================== */

const Favorites = (() => {
    const STORAGE_KEY = "favoritePairs";
    const LIMIT = 12;

    function isStorageAvailable() {
        try {
            const testKey = "__favorites_storage_test__";

            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);

            return true;
        } catch {
            return false;
        }
    }

    function createId() {
        if (crypto && typeof crypto.randomUUID === "function") {
            return crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function normalizeCode(code) {
        return String(code || "").trim().toUpperCase();
    }

    function pairKey(from, to) {
        return `${normalizeCode(from)}-${normalizeCode(to)}`;
    }

    function normalizeItem(item = {}) {
        const from = normalizeCode(item.from);
        const to = normalizeCode(item.to);

        return {
            id: item.id || createId(),
            key: item.key || pairKey(from, to),
            from,
            to,
            createdAt: item.createdAt || new Date().toLocaleString("pt-BR")
        };
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

            return data.map(normalizeItem);
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

    function exists(from, to) {
        const key = pairKey(from, to);

        return getAll().some(item => item.key === key);
    }

    function add(from, to) {
        const cleanFrom = normalizeCode(from);
        const cleanTo = normalizeCode(to);

        if (!cleanFrom || !cleanTo) {
            UI.alert("Selecione as moedas antes de favoritar.", "warning");
            return null;
        }

        if (cleanFrom === cleanTo) {
            UI.alert("Selecione moedas diferentes para favoritar.", "warning");
            return null;
        }

        if (exists(cleanFrom, cleanTo)) {
            UI.alert("Esse par já está nos favoritos.", "warning");
            return null;
        }

        const items = getAll();

        const newItem = normalizeItem({
            from: cleanFrom,
            to: cleanTo
        });

        const newList = [
            newItem,
            ...items
        ].slice(0, LIMIT);

        save(newList);
        render();

        UI.alert("Par adicionado aos favoritos.", "success");

        return newItem;
    }

    function remove(id) {
        if (!id) return;

        const items = getAll().filter(item => item.id !== id);

        save(items);
        render();

        UI.alert("Favorito removido.", "success");
    }

    function clear() {
        if (isStorageAvailable()) {
            localStorage.removeItem(STORAGE_KEY);
        }

        render();

        UI.alert("Favoritos apagados.", "success");
    }

    function usePair(from, to) {
        const cleanFrom = normalizeCode(from);
        const cleanTo = normalizeCode(to);

        if (!cleanFrom || !cleanTo) return;

        UI.setValue("#fromCurrency", cleanFrom);
        UI.setValue("#toCurrency", cleanTo);

        if (typeof Converter !== "undefined") {
            Converter.convert();
        }

        UI.scrollToElement("#converter");
    }

    function render() {
        const container = UI.$("#favoritesList");

        if (!container) return;

        const items = getAll();

        if (!items.length) {
            container.innerHTML = `
                <div class="history-item">
                    <span>Nenhum par favorito salvo ainda.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="history-item">
                <div>
                    <strong>
                        ${UI.escapeHTML(item.from)} → ${UI.escapeHTML(item.to)}
                    </strong>
                    <br>
                    <small>
                        Salvo em ${UI.escapeHTML(item.createdAt)}
                    </small>
                </div>

                <div class="flex" style="gap:10px;flex-wrap:wrap;">
                    <button
                        type="button"
                        class="btn-secondary"
                        data-use-favorite="${UI.escapeHTML(item.from)}|${UI.escapeHTML(item.to)}">
                        Usar
                    </button>

                    <button
                        type="button"
                        class="btn-secondary"
                        data-remove-favorite="${UI.escapeHTML(item.id)}">
                        Remover
                    </button>
                </div>
            </div>
        `).join("");

        bindRenderedButtons();
    }

    function bindRenderedButtons() {
        UI.$all("[data-use-favorite]").forEach(button => {
            button.addEventListener("click", () => {
                const [from, to] = button.dataset.useFavorite.split("|");
                usePair(from, to);
            });
        });

        UI.$all("[data-remove-favorite]").forEach(button => {
            button.addEventListener("click", () => {
                remove(button.dataset.removeFavorite);
            });
        });
    }

    function bindEvents() {
        const button = UI.$("#favoriteButton");

        if (!button) return;

        button.addEventListener("click", () => {
            const from = UI.value("#fromCurrency");
            const to = UI.value("#toCurrency");

            add(from, to);
        });
    }

    function exportJSON() {
        return JSON.stringify(getAll(), null, 2);
    }

    function importJSON(json) {
        try {
            const data = JSON.parse(json);

            if (!Array.isArray(data)) {
                throw new Error("Formato inválido.");
            }

            const normalized = data
                .map(normalizeItem)
                .filter(item => item.from && item.to && item.from !== item.to)
                .slice(0, LIMIT);

            save(normalized);
            render();

            return true;
        } catch {
            return false;
        }
    }

    function init() {
        bindEvents();
        render();
    }

    return {
        getAll,
        add,
        remove,
        clear,
        exists,
        usePair,
        render,
        exportJSON,
        importJSON,
        init
    };
})();