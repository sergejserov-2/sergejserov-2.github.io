export class Bridge {
    constructor({ game, mapUI, staticUI }) {
        this.game = game;
        this.mapUI = mapUI;
        this.staticUI = staticUI;

        this.bindGameEvents();
        this.bindMapEvents();
    }

    // =====================================================
    // GAME → UI
    // =====================================================

    bindGameEvents() {

        this.game.on("gameStarted", () => {
            this.staticUI.showGame();
            this.staticUI.updateHUD(this.game.getHUDState());
        });

        this.game.on("roundLoading", () => {
            this.staticUI.showLoading();
        });

        this.game.on("roundReady", ({ round }) => {
            this.staticUI.showRoundReady(round);
        });

        this.game.on("roundStarted", ({ location }) => {

            this.staticUI.hideLoading();
            this.staticUI.startRound();

            this.mapUI.initRound({ location });
            this.mapUI.enableGuessMode();

            this.mapUI.clearGuessMarker();
            this.mapUI.clearOverview();

            // 💥 ВАЖНО: кнопка биндим тут, когда DOM гарантирован
            this.bindGuessButton();

            this.staticUI.updateHUD(this.game.getHUDState());
        });

        this.game.on("hudUpdated", (hud) => {
            this.staticUI.updateHUD(hud);
        });

        this.game.on("guessFinished", ({ result }) => {
            this.mapUI.disableGuessMode();
            this.staticUI.showRoundResult({
                result,
                totalScore: this.game.score
            });
        });

        this.game.on("roundEnded", (data) => {
            this.mapUI.renderOverview({
                guess: this.game.getCurrentGuess(),
                actual: this.game.current
            });
        });

        this.game.on("gameEnded", (data) => {
            this.staticUI.showRoundResult({
                result,
                totalScore: this.game.score
            });
        });
    }

    // =====================================================
    // MAP → GAME
    // =====================================================

    bindMapEvents() {
        this.mapUI.onGuess((point) => {
            this.game.setGuess("p1", point);
            this.mapUI.placeGuessMarker(point);
        });
    }

    // =====================================================
    // BUTTON → GAME
    // =====================================================

    bindGuessButton() {
        const btn = document.getElementById("makeGuess");

        if (!btn) {
            console.warn("[makeGuess] not found");
            return;
        }

        // убираем старые обработчики (важно при rerender)
        btn.onclick = null;

        btn.onclick = () => {
            console.log("[GUESS CLICK]");
            this.game.finishGuess("p1");
        };
    }
}
