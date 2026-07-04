/* ==========================================================
   Conversor de Moedas
   news.js
   Ticker de notícias financeiras
========================================================== */

const News = (() => {
    const RSS_FEEDS = [
		"https://news.google.com/rss/search?q=mercado+financeiro+OR+d%C3%B3lar+OR+bolsa+de+valores+OR+ibovespa+OR+bitcoin+OR+economia+brasil&hl=pt-BR&gl=BR&ceid=BR:pt-419",
		"https://news.google.com/rss/search?q=site:infomoney.com.br+mercado+financeiro+OR+d%C3%B3lar+OR+ibovespa+OR+bitcoin&hl=pt-BR&gl=BR&ceid=BR:pt-419",
		"https://news.google.com/rss/search?q=site:valor.globo.com+economia+OR+mercados+OR+d%C3%B3lar+OR+bolsa&hl=pt-BR&gl=BR&ceid=BR:pt-419",
		"https://news.google.com/rss/search?q=site:einvestidor.estadao.com.br+mercado+OR+d%C3%B3lar+OR+bolsa+OR+bitcoin&hl=pt-BR&gl=BR&ceid=BR:pt-419"
	];

    const RSS_TO_JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

    const STORAGE_KEY = "financialNewsTicker";
    const CACHE_TIME = 1000 * 60 * 20;

    function getContainer() {
        return document.querySelector("#newsTickerContent");
    }

    function cleanText(value = "") {
        const div = document.createElement("div");
        div.innerHTML = value;

        return div.textContent
            .replace(/\s+/g, " ")
            .trim();
    }

    function getCachedNews() {
        try {
            const cached = JSON.parse(localStorage.getItem(STORAGE_KEY));

            if (!cached) return null;

            const age = Date.now() - cached.timestamp;

            if (age > CACHE_TIME) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            return cached.items;
        } catch {
            return null;
        }
    }

    function setCachedNews(items) {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    timestamp: Date.now(),
                    items
                })
            );
        } catch {
            // Ignora erro de localStorage.
        }
    }

    async function fetchFeed(feedUrl) {
        const url = RSS_TO_JSON + encodeURIComponent(feedUrl);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Falha ao buscar notícias.");
        }

        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) {
            return [];
        }

        return data.items
            .map(item => ({
                title: cleanText(item.title),
                link: item.link
            }))
            .filter(item => item.title && item.link);
    }

    async function fetchNews() {
        const cached = getCachedNews();

        if (cached && cached.length) {
            return cached;
        }

        const results = await Promise.allSettled(
            RSS_FEEDS.map(fetchFeed)
        );

        const items = results
            .filter(result => result.status === "fulfilled")
            .flatMap(result => result.value)
            .slice(0, 15);

        if (items.length) {
            setCachedNews(items);
        }

        return items;
    }

    function render(items = []) {
        const container = getContainer();

        if (!container) return;

        if (!items.length) {
            container.innerHTML = `
                <span>
                    Notícias indisponíveis no momento.
                </span>
            `;
            return;
        }

        const html = items.map(item => `
            <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                ${item.title}
            </a>
        `).join(`<span class="ticker-separator">•</span>`);

        /*
           Duplicamos o conteúdo para criar efeito contínuo,
           sem espaço vazio no final da animação.
        */
        container.innerHTML = `
            <div class="ticker-track">
                <div class="ticker-items">
                    ${html}
                </div>

                <div class="ticker-items" aria-hidden="true">
                    ${html}
                </div>
            </div>
        `;
    }

    async function init() {
        const container = getContainer();

        if (!container) return;

        try {
            const items = await fetchNews();
            render(items);
        } catch (error) {
            console.warn("[News] Erro ao carregar notícias.", error);

            render([]);
        }
    }

    return {
        init,
        fetchNews
    };
})();