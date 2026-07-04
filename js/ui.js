/* ==========================================================
   Conversor de Moedas
   ui.js
   Camada de interface
========================================================== */

const UI = (() => {
    function $(selector, context = document) {
        return context.querySelector(selector);
    }

    function $all(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    function show(element) {
        if (element) {
            element.classList.remove("hidden");
        }
    }

    function hide(element) {
        if (element) {
            element.classList.add("hidden");
        }
    }

    function text(selector, value) {
        const element = $(selector);

        if (element) {
            element.textContent = value;
        }
    }

    function html(selector, value) {
        const element = $(selector);

        if (element) {
            element.innerHTML = value;
        }
    }

    function value(selector) {
        const element = $(selector);

        return element ? element.value : "";
    }

    function setValue(selector, newValue) {
        const element = $(selector);

        if (element) {
            element.value = newValue;
        }
    }

    function loading(isLoading = true) {
        const loader = $("#loading");
        const result = $("#resultContainer");

        if (isLoading) {
            show(loader);
            hide(result);
        } else {
            hide(loader);
            show(result);
        }
    }

    function updateResult(data = {}) {
        text("#resultValue", data.result || "--");
        text("#exchangeRate", data.rate || "--");
        text("#highValue", data.high || "--");
        text("#lowValue", data.low || "--");
        text("#lastUpdate", data.update || "Última atualização: --");
    }

    function updateMarket(data = {}) {
        text("#usdPrice", data.usd || "--");
        text("#eurPrice", data.eur || "--");
        text("#gbpPrice", data.gbp || "--");
        text("#btcPrice", data.btc || "--");
        text("#ethPrice", data.eth || "--");
        text("#solPrice", data.sol || "--");
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function renderHistory(items = []) {
        const container = $("#historyList");

        if (!container) return;

        if (!items.length) {
            container.innerHTML = `
                <div class="history-item">
                    <span>Nenhuma conversão realizada ainda.</span>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="history-item">
                <div>
                    <strong>
                        ${escapeHTML(item.amount)} ${escapeHTML(item.from)}
                        →
                        ${escapeHTML(item.to)}
                    </strong>
                    <br>
                    <small>${escapeHTML(item.result)}</small>
                </div>
                <small>${escapeHTML(item.date)}</small>
            </div>
        `).join("");
    }

    function alert(message, type = "success") {
        const div = document.createElement("div");

        div.className = `alert alert-${type}`;
        div.textContent = message;
        div.setAttribute("role", "alert");

        document.body.appendChild(div);

        div.style.position = "fixed";
        div.style.top = "90px";
        div.style.right = "24px";
        div.style.zIndex = "9999";
        div.style.maxWidth = "340px";
        div.style.boxShadow = "0 12px 30px rgba(0,0,0,.15)";

        setTimeout(() => {
            div.remove();
        }, 3500);
    }

    async function copy(textToCopy) {
        if (!textToCopy) {
            alert("Não há conteúdo para copiar.", "warning");
            return;
        }

        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(textToCopy);
                alert("Resultado copiado com sucesso!", "success");
                return;
            }

            const textarea = document.createElement("textarea");

            textarea.value = textToCopy;
            textarea.style.position = "fixed";
            textarea.style.opacity = "0";

            document.body.appendChild(textarea);

            textarea.focus();
            textarea.select();

            document.execCommand("copy");

            textarea.remove();

            alert("Resultado copiado com sucesso!", "success");
        } catch {
            alert("Não foi possível copiar o resultado.", "error");
        }
    }

    function setupBackToTop() {
        const button = $("#backToTop");

        if (!button) return;

        window.addEventListener("scroll", () => {
            if (window.scrollY > 400) {
                button.classList.add("show");
            } else {
                button.classList.remove("show");
            }
        });

        button.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    function setupCookies() {
        const banner = $("#cookieBanner");
        const button = $("#acceptCookies");

        if (!banner || !button) return;

        const accepted = localStorage.getItem("cookiesAccepted");

        if (!accepted) {
            banner.classList.add("show");
        }

        button.addEventListener("click", () => {
            localStorage.setItem("cookiesAccepted", "true");
            banner.classList.remove("show");
        });
    }

    function swapCurrencies() {
        const from = $("#fromCurrency");
        const to = $("#toCurrency");

        if (!from || !to) return;

        const temp = from.value;

        from.value = to.value;
        to.value = temp;
    }

    function disableButton(selector, disabled = true) {
        const button = $(selector);

        if (button) {
            button.disabled = disabled;
        }
    }

    function setButtonLoading(selector, isLoading = true, loadingText = "Carregando...") {
        const button = $(selector);

        if (!button) return;

        if (isLoading) {
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
            button.disabled = true;
        } else {
            button.textContent = button.dataset.originalText || button.textContent;
            button.disabled = false;
        }
    }

    function scrollToElement(selector) {
        const element = $(selector);

        if (!element) return;

        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    function init() {
        setupBackToTop();
        setupCookies();
    }

    return {
        $,
        $all,
        show,
        hide,
        text,
        html,
        value,
        setValue,
        loading,
        updateResult,
        updateMarket,
        renderHistory,
        alert,
        copy,
        swapCurrencies,
        disableButton,
        setButtonLoading,
        scrollToElement,
        escapeHTML,
        init
    };
})();