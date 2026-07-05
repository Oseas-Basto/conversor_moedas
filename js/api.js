/* ==========================================================
   Conversor de Moedas
   api.js
   Comunicação com AwesomeAPI
========================================================== */

const API = (() => {
    const BASE_URL = "https://economia.awesomeapi.com.br/json";
    const CACHE_TIME = 30000;
    const REQUEST_TIMEOUT = 10000;
    const MAX_RETRIES = 3;

    const cache = new Map();

    function buildUrl(endpoint) {
        return `${BASE_URL}/${endpoint}`;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getCache(url) {
        const cached = cache.get(url);

        if (!cached) return null;

        const age = Date.now() - cached.timestamp;

        if (age > CACHE_TIME) {
            cache.delete(url);
            return null;
        }

        return cached.data;
    }

    function setCache(url, data) {
        cache.set(url, {
            timestamp: Date.now(),
            data
        });
    }

    async function request(endpoint) {
        const url = buildUrl(endpoint);

        const cached = getCache(url);

        if (cached) {
            return cached;
        }

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, REQUEST_TIMEOUT);

        try {
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
                headers: {
                    "Accept": "application/json"
                }
            });

            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }

            const data = await response.json();

            setCache(url, data);

            return data;
        } catch (error) {
            clearTimeout(timeout);

            if (error.name === "AbortError") {
                throw new Error("Tempo limite excedido ao consultar a API.");
            }

            throw error;
        }
    }

    async function retry(callback, retries = MAX_RETRIES) {
        let lastError;

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await callback();
            } catch (error) {
                lastError = error;

                if (attempt < retries) {
                    await sleep(700 * attempt);
                }
            }
        }

        throw lastError;
    }

    async function getQuotation(from, to) {
        if (!from || !to) {
            throw new Error("Moedas inválidas.");
        }

        return retry(() => request(`last/${from}-${to}`));
    }

    async function getMultipleQuotes(pairs = []) {
        if (!Array.isArray(pairs) || pairs.length === 0) {
            return {};
        }

        const cleanPairs = pairs
            .filter(Boolean)
            .map(pair => String(pair).toUpperCase().trim());

        if (!cleanPairs.length) {
            return {};
        }

        return retry(() => request(`last/${cleanPairs.join(",")}`));
    }

    async function getDailyHistory(from, to, days = 30) {
        if (!from || !to) {
            throw new Error("Moedas inválidas.");
        }

        const safeDays = Math.max(1, Math.min(Number(days) || 30, 365));

        return retry(() => request(`daily/${from}-${to}/${safeDays}`));
    }

    async function getAvailableCurrencies() {
        return retry(() => request("available"));
    }

    async function preload() {
		try {
			await getMultipleQuotes([
				"USD-BRL",
				"EUR-BRL",
				"GBP-BRL",
				"BTC-BRL",
				"ETH-BRL",
				"USDT-BRL",
				"BNB-BRL",
				"SOL-BRL",
				"XRP-BRL",
				"ADA-BRL"
			]);
		} catch (error) {
			console.warn("[API] Falha no pré-carregamento.", error);
		}
	}

    function formatNumber(value, options = {}) {
        const number = Number(value);

        if (Number.isNaN(number)) {
            return "--";
        }

        return number.toLocaleString("pt-BR", {
            minimumFractionDigits: options.minimumFractionDigits ?? 2,
            maximumFractionDigits: options.maximumFractionDigits ?? 8
        });
    }

    function formatMoney(value, currency = "BRL") {
        const number = Number(value);

        if (Number.isNaN(number)) {
            return "--";
        }

        try {
            return number.toLocaleString("pt-BR", {
                style: "currency",
                currency
            });
        } catch {
            return `${formatNumber(number)} ${currency}`;
        }
    }

    function formatPercent(value) {
        const number = Number(value);

        if (Number.isNaN(number)) {
            return "--";
        }

        return `${number.toFixed(2)}%`;
    }

    function formatDate(dateString) {
        if (!dateString) return "--";

        return new Date(dateString).toLocaleString("pt-BR");
    }

    function formatUnix(timestamp) {
        if (!timestamp) return "--";

        return new Date(Number(timestamp) * 1000).toLocaleString("pt-BR");
    }

    function isOnline() {
        return navigator.onLine;
    }

    function clearCache() {
        cache.clear();
    }

    function cacheSize() {
        return cache.size;
    }

    function startAutoUpdate(callback, interval = 30000) {
        if (typeof callback !== "function") {
            throw new Error("Callback inválido para atualização automática.");
        }

        callback();

        return setInterval(callback, interval);
    }

    function stopAutoUpdate(timer) {
        if (timer) {
            clearInterval(timer);
        }
    }

    function dispatch(eventName, detail = {}) {
        window.dispatchEvent(
            new CustomEvent(eventName, {
                detail
            })
        );
    }

    function listen(eventName, callback) {
        window.addEventListener(eventName, callback);
    }

    function remove(eventName, callback) {
        window.removeEventListener(eventName, callback);
    }

    async function healthCheck() {
        try {
            await getQuotation("USD", "BRL");
            return true;
        } catch {
            return false;
        }
    }

    function log(...message) {
        console.log(
            "%c[Conversor API]",
            "color:#0d6efd;font-weight:bold",
            ...message
        );
    }

    function info(...message) {
        console.info(
            "%c[Conversor API]",
            "color:#198754;font-weight:bold",
            ...message
        );
    }

    function error(...message) {
        console.error(
            "%c[Conversor API]",
            "color:#dc3545;font-weight:bold",
            ...message
        );
    }

    return {
        request,
        getQuotation,
        getMultipleQuotes,
        getDailyHistory,
        getAvailableCurrencies,
        preload,
        formatNumber,
        formatMoney,
        formatPercent,
        formatDate,
        formatUnix,
        isOnline,
        clearCache,
        cacheSize,
        startAutoUpdate,
        stopAutoUpdate,
        dispatch,
        listen,
        remove,
        healthCheck,
        log,
        info,
        error,

        // Aliases para compatibilidade com os outros arquivos já criados
        number: formatNumber,
        money: formatMoney,
        percentage: formatPercent,
        date: formatDate,
        unix: formatUnix,
        safeQuotation: getQuotation,
        safeHistory: getDailyHistory
    };
})();