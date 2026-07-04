/* ==========================================================
   Conversor de Moedas
   dashboard.js
   Dashboard financeiro
========================================================== */

const Dashboard = (() => {
    const PAIRS = [
		{
			key: "USDBRL",
			pair: "USD-BRL",
			name: "Dólar",
			code: "USD",
			selector: "#usdPrice"
		},
		{
			key: "EURBRL",
			pair: "EUR-BRL",
			name: "Euro",
			code: "EUR",
			selector: "#eurPrice"
		},
		{
			key: "GBPBRL",
			pair: "GBP-BRL",
			name: "Libra",
			code: "GBP",
			selector: "#gbpPrice"
		},
		{
			key: "BTCBRL",
			pair: "BTC-BRL",
			name: "Bitcoin",
			code: "BTC",
			selector: "#btcPrice"
		},
		{
			key: "ETHBRL",
			pair: "ETH-BRL",
			name: "Ethereum",
			code: "ETH",
			selector: "#ethPrice"
		},
		{
			key: "USDTBRL",
			pair: "USDT-BRL",
			name: "Tether",
			code: "USDT",
			selector: null
		},
		{
			key: "BNBBRL",
			pair: "BNB-BRL",
			name: "BNB",
			code: "BNB",
			selector: null
		},
		{
			key: "SOLBRL",
			pair: "SOL-BRL",
			name: "Solana",
			code: "SOL",
			selector: "#solPrice"
		},
		{
			key: "XRPBRL",
			pair: "XRP-BRL",
			name: "XRP",
			code: "XRP",
			selector: null
		},
		{
			key: "ADABRL",
			pair: "ADA-BRL",
			name: "Cardano",
			code: "ADA",
			selector: null
		},
		{
			key: "DOGEBRL",
			pair: "DOGE-BRL",
			name: "Dogecoin",
			code: "DOGE",
			selector: null
		},
		{
			key: "LTCBRL",
			pair: "LTC-BRL",
			name: "Litecoin",
			code: "LTC",
			selector: null
		}
	];

    let lastQuotes = {};

    function formatBRL(value) {
        return API.formatMoney(value, "BRL");
    }

    function formatPercent(value) {
        return API.formatPercent(value);
    }

    function getVariationClass(value) {
        const number = Number(value);

        if (number > 0) return "positive";
        if (number < 0) return "negative";

        return "neutral";
    }

    function getVariationSymbol(value) {
        const number = Number(value);

        if (number > 0) return "▲";
        if (number < 0) return "▼";

        return "■";
    }

    function getQuote(item, quotes) {
        return quotes[item.key] || null;
    }

    function updateSimpleCards(quotes) {
        PAIRS.forEach(item => {
            const quote = getQuote(item, quotes);

            if (!quote) return;
			
			if (!item.selector) return;

            const element = UI.$(item.selector);

            if (!element) return;

            element.textContent = formatBRL(quote.bid);

            const card = element.closest(".market-card");

            if (!card) return;

            let variation = card.querySelector(".market-variation");

            if (!variation) {
                variation = document.createElement("small");
                variation.className = "market-variation";
                card.appendChild(variation);
            }

            const variationClass = getVariationClass(quote.pctChange);

            variation.classList.remove("positive", "negative", "neutral");
            variation.classList.add(variationClass);

            variation.textContent = `${getVariationSymbol(quote.pctChange)} ${formatPercent(quote.pctChange)}`;
        });
    }

    function renderDetailedDashboard(quotes) {
        const container = UI.$("#dashboardList");

        if (!container) return;

        const html = PAIRS.map(item => {
            const quote = getQuote(item, quotes);

            if (!quote) {
                return "";
            }

            const variationClass = getVariationClass(quote.pctChange);

            return `
                <article class="market-card">
                    <span>${item.name} (${item.code})</span>

                    <strong>${formatBRL(quote.bid)}</strong>

                    <small class="${variationClass}">
                        ${getVariationSymbol(quote.pctChange)} ${formatPercent(quote.pctChange)}
                    </small>

                    <div class="mt-2">
                        <small>Compra: ${formatBRL(quote.bid)}</small><br>
                        <small>Venda: ${formatBRL(quote.ask)}</small><br>
                        <small>Máxima: ${formatBRL(quote.high)}</small><br>
                        <small>Mínima: ${formatBRL(quote.low)}</small><br>
                        <small>Atualizado: ${API.formatUnix(quote.timestamp)}</small>
                    </div>
                </article>
            `;
        }).join("");

        container.innerHTML = html || `
            <div class="history-item">
                <span>Não foi possível carregar o dashboard agora.</span>
            </div>
        `;
    }

    function renderLoading() {
        const container = UI.$("#dashboardList");

        if (!container) return;

        container.innerHTML = PAIRS.map(item => `
            <article class="market-card skeleton" style="min-height:180px;">
                <span>${item.name}</span>
                <strong>Carregando...</strong>
            </article>
        `).join("");
    }

    async function update() {
        try {
            const quotes = await API.getMultipleQuotes(
                PAIRS.map(item => item.pair)
            );

            lastQuotes = quotes || {};

            updateSimpleCards(lastQuotes);
            renderDetailedDashboard(lastQuotes);

            return lastQuotes;
        } catch (error) {
            console.warn("[Dashboard] Erro ao atualizar cotações.", error);

            const container = UI.$("#dashboardList");

            if (container) {
                container.innerHTML = `
                    <div class="history-item">
                        <span>Não foi possível atualizar as cotações agora.</span>
                    </div>
                `;
            }

            return null;
        }
    }

    function getLastQuotes() {
        return lastQuotes;
    }

    function init() {
        renderLoading();
        update();
    }

    return {
        init,
        update,
        getLastQuotes
    };
})();