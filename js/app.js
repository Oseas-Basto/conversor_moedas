/* ==========================================================
   Conversor de Moedas
   app.js
   Inicialização centralizada do projeto
========================================================== */

const App = (() => {
    const VERSION = "1.0.0";
    const SITE_URL = "https://conversordemoedas.top/";

    let marketTimer = null;

    function checkDependencies() {
        const missing = [];

        if (typeof API === "undefined") missing.push("API");
        if (typeof UI === "undefined") missing.push("UI");
        if (typeof History === "undefined") missing.push("History");
        if (typeof Favorites === "undefined") missing.push("Favorites");
        if (typeof Theme === "undefined") missing.push("Theme");
        if (typeof Dashboard === "undefined") missing.push("Dashboard");
        if (typeof Converter === "undefined") missing.push("Converter");

        if (missing.length > 0) {
            console.error("[Conversor] Arquivos JS não carregados:", missing.join(", "));
            return false;
        }

        return true;
    }

    function registerServiceWorker() {
        if (!("serviceWorker" in navigator)) return;

        navigator.serviceWorker
            .register("sw.js")
            .then(() => {
                console.info("[Conversor] Service Worker registrado.");
            })
            .catch(error => {
                console.warn("[Conversor] Falha ao registrar Service Worker.", error);
            });
    }

    function setupOnlineStatus() {
        window.addEventListener("online", () => {
            UI.alert("Conexão restabelecida.", "success");
            Dashboard.update();
            Converter.convert();
        });

        window.addEventListener("offline", () => {
            UI.alert("Você está sem conexão com a internet.", "warning");
        });
    }

    function setupKeyboardShortcuts() {
        document.addEventListener("keydown", event => {
            const key = event.key.toLowerCase();

            if (event.ctrlKey && key === "k") {
                event.preventDefault();

                const amountInput = UI.$("#amount");

                if (amountInput) {
                    amountInput.focus();
                    amountInput.select();
                }
            }

            if (event.ctrlKey && event.key === "Enter") {
                event.preventDefault();
                Converter.convert();
            }
        });
    }

    function setupShareButton() {
        const button = UI.$("#shareButton");

        if (!button) return;

        button.addEventListener("click", async () => {
            const shareData = {
                title: "Conversor de Moedas",
                text: "Converta moedas e criptomoedas em tempo real.",
                url: SITE_URL
            };

            try {
                if (navigator.share) {
                    await navigator.share(shareData);
                    return;
                }

                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(SITE_URL);
                    UI.alert("Link copiado para a área de transferência.", "success");
                    return;
                }

                UI.alert("Compartilhamento não disponível neste navegador.", "warning");
            } catch (error) {
                console.warn("[Conversor] Compartilhamento cancelado.", error);
            }
        });
    }

    function setupInstallPrompt() {
        let deferredPrompt = null;
        const button = UI.$("#installButton");

        window.addEventListener("beforeinstallprompt", event => {
            event.preventDefault();
            deferredPrompt = event;

            if (button) {
                button.classList.remove("hidden");
            }
        });

        if (!button) return;

        button.addEventListener("click", async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();

            await deferredPrompt.userChoice;

            deferredPrompt = null;
            button.classList.add("hidden");
        });
    }

    async function preloadData() {
        if (!API.isOnline()) {
            UI.alert("Você está offline. Algumas funções podem não carregar.", "warning");
            return;
        }

        try {
            await API.preload();
        } catch (error) {
            console.warn("[Conversor] Falha ao pré-carregar dados.", error);
        }
    }

    function startAutoUpdates() {
        if (marketTimer) {
            API.stopAutoUpdate(marketTimer);
        }

        marketTimer = API.startAutoUpdate(() => {
            Dashboard.update();
        }, 30000);
    }

    function exposeDebugInfo() {
        window.ConversorMoedas = {
            version: VERSION,
            siteUrl: SITE_URL
        };
    }

    async function init() {
    console.info(`[Conversor] Iniciando aplicação v${VERSION}`);

    if (!checkDependencies()) {
        return;
		}

		UI.init();
		Theme.init();
		History.init();
		Favorites.init();

		Converter.init();

		setupOnlineStatus();
		setupKeyboardShortcuts();
		setupShareButton();
		setupInstallPrompt();
		exposeDebugInfo();

		setTimeout(async () => {
			if (typeof API !== "undefined") {
				await API.preload();
			}
		}, 1000);

		setTimeout(() => {
			if (typeof Dashboard !== "undefined") {
				Dashboard.init();
				startAutoUpdates();
			}
		}, 1800);

		setTimeout(() => {
			if (typeof News !== "undefined") {
				News.init();
			}
		}, 2500);

		setTimeout(() => {
			registerServiceWorker();
		}, 4000);

		console.info("[Conversor] Aplicação iniciada com sucesso.");
	}

    return {
        init,
        version: VERSION,
        siteUrl: SITE_URL
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    App.init();
});