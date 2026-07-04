/* ==========================================================
   Conversor de Moedas
   converter.js
   Lógica principal de conversão
========================================================== */

const Converter = (() => {
    let lastResultText = "";
    let lastConversion = null;
    let debounceTimer = null;

    const CRYPTO_CURRENCIES = [
        "BTC",
        "ETH",
        "USDT",
        "BNB",
        "SOL"
    ];

    function normalizeCurrency(code) {
        return String(code || "").trim().toUpperCase();
    }

    function getPairKey(from, to) {
        return `${normalizeCurrency(from)}${normalizeCurrency(to)}`;
    }

    function isCrypto(currency) {
        return CRYPTO_CURRENCIES.includes(normalizeCurrency(currency));
    }

    function formatCurrency(value, currency) {
        const code = normalizeCurrency(currency);

        if (isCrypto(code)) {
            return `${API.formatNumber(value, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 8
            })} ${code}`;
        }

        return API.formatMoney(value, code);
    }

    function formatInputAmount(amount) {
        return Number(amount).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        });
    }

    function clearResult() {
        UI.updateResult({
            result: "--",
            rate: "--",
            high: "--",
            low: "--",
            update: "Última atualização: --"
        });
    }

    async function getQuoteWithFallback(from, to) {
        const directKey = getPairKey(from, to);

        try {
            const directData = await API.getQuotation(from, to);

            if (directData && directData[directKey]) {
                return {
                    quote: directData[directKey],
                    inverted: false
                };
            }
        } catch {
            // Tenta cotação inversa abaixo.
        }

        const inverseKey = getPairKey(to, from);

        try {
            const inverseData = await API.getQuotation(to, from);

            if (inverseData && inverseData[inverseKey]) {
                return {
                    quote: inverseData[inverseKey],
                    inverted: true
                };
            }
        } catch {
            // Se também falhar, erro será lançado abaixo.
        }

        throw new Error(`Cotação ${from}-${to} não encontrada.`);
    }

    function calculateQuoteValues(quote, inverted = false) {
        const bid = Number(quote.bid);
        const high = Number(quote.high);
        const low = Number(quote.low);

        if (!bid || Number.isNaN(bid)) {
            throw new Error("Cotação inválida retornada pela API.");
        }

        if (!inverted) {
            return {
                bid,
                high,
                low
            };
        }

        return {
            bid: 1 / bid,
            high: low ? 1 / low : null,
            low: high ? 1 / high : null
        };
    }

    function getFormData() {
        return {
            from: normalizeCurrency(UI.value("#fromCurrency")),
            to: normalizeCurrency(UI.value("#toCurrency")),
            amount: Number(UI.value("#amount"))
        };
    }

    function validate({ from, to, amount }) {
        if (!from || !to) {
            UI.alert("Selecione as moedas de origem e destino.", "warning");
            return false;
        }

        if (from === to) {
            UI.alert("Escolha moedas diferentes para converter.", "warning");
            return false;
        }

        if (!amount || Number.isNaN(amount) || amount <= 0) {
            UI.alert("Digite um valor maior que zero.", "warning");
            return false;
        }

        return true;
    }

    async function convert() {
        const data = getFormData();

        if (!validate(data)) {
            clearResult();
            return;
        }

        UI.loading(true);
        UI.disableButton("#convertButton", true);

        try {
            const { from, to, amount } = data;

            const response = await getQuoteWithFallback(from, to);

            const values = calculateQuoteValues(
                response.quote,
                response.inverted
            );

            const convertedValue = amount * values.bid;

            const resultFormatted = formatCurrency(convertedValue, to);
            const rateFormatted = `1 ${from} = ${formatCurrency(values.bid, to)}`;

            const highFormatted = values.high
                ? formatCurrency(values.high, to)
                : "--";

            const lowFormatted = values.low
                ? formatCurrency(values.low, to)
                : "--";

            const updateText = response.quote.timestamp
                ? `Última atualização: ${API.formatUnix(response.quote.timestamp)}`
                : "Última atualização: --";

            lastResultText = `${formatInputAmount(amount)} ${from} = ${resultFormatted}`;
            lastConversion = {
                amount,
                from,
                to,
                result: resultFormatted,
                rate: rateFormatted
            };

            UI.updateResult({
                result: resultFormatted,
                rate: rateFormatted,
                high: highFormatted,
                low: lowFormatted,
                update: updateText
            });

            if (typeof History !== "undefined") {
                History.add({
                    amount: formatInputAmount(amount),
                    from,
                    to,
                    result: resultFormatted,
                    rate: rateFormatted
                });
            }

        } catch (error) {
            console.error("[Converter] Erro na conversão:", error);

            clearResult();

            UI.alert(
                "Não foi possível consultar essa cotação agora. Tente outro par de moedas.",
                "error"
            );

        } finally {
            UI.loading(false);
            UI.disableButton("#convertButton", false);
        }
    }

    function copyResult() {
        if (!lastResultText) {
            UI.alert("Faça uma conversão antes de copiar.", "warning");
            return;
        }

        UI.copy(lastResultText);
    }

    function debouncedConvert(delay = 700) {
        clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            convert();
        }, delay);
    }

    function bindEvents() {
        const convertButton = UI.$("#convertButton");
        const copyButton = UI.$("#copyButton");
        const swapButton = UI.$("#swapCurrencies");
        const amountInput = UI.$("#amount");
        const fromSelect = UI.$("#fromCurrency");
        const toSelect = UI.$("#toCurrency");

        if (convertButton) {
            convertButton.addEventListener("click", convert);
        }

        if (copyButton) {
            copyButton.addEventListener("click", copyResult);
        }

        if (swapButton) {
            swapButton.addEventListener("click", () => {
                UI.swapCurrencies();
                convert();
            });
        }

        if (amountInput) {
            amountInput.addEventListener("input", () => {
                debouncedConvert();
            });

            amountInput.addEventListener("keydown", event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    convert();
                }
            });
        }

        if (fromSelect) {
            fromSelect.addEventListener("change", convert);
        }

        if (toSelect) {
            toSelect.addEventListener("change", convert);
        }
    }

    function init() {
        bindEvents();
        convert();
    }

    return {
        init,
        convert,
        copyResult,
        getLastConversion: () => lastConversion,
        getLastResultText: () => lastResultText
    };
})();