export class Bridge {
    constructor({ game, mapUI, staticUI }) {
        this.game = game;
        this.mapUI = mapUI;
        this.staticUI = staticUI;

        this.bindGameEvents();
        this.bindMapEvents();
        this.bindUIEvents(); //
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

            this.staticUI.updateHUD(this.game.getHUDState());
        });

        this.game.on("hudUpdated", (hud) => {
            this.staticUI.updateHUD(hud);
        });

        this.game.on("guessFinished", ({ result }) => {
            const guess = this.game.getCurrentGuess();

            this.mapUI.disableGuessMode();
            this.staticUI.showRoundResult(result);
            this.mapUI.placeGuessMarker(this.game.players.p1.lastGuess);
        });

        this.game.on("roundEnded", (data) => {
            this.staticUI.showRoundResult(data);

            this.mapUI.renderOverview({
                guess: this.game.players.p1.lastGuess,
                actual: this.game.current
            });
        });

        this.game.on("gameEnded", (data) => {
            this.staticUI.showGameResult(data);
        });
    }

    // =====================================================
    // MAP → GAME (ТОЛЬКО ВЫБОР ТОЧКИ)
    // =====================================================

    bindMapEvents() {
        this.mapUI.onGuess((point) => {
            this.game.setGuess("p1", point);
        });
    }

    // =====================================================
    // UI → GAME (КНОПКА ПОДТВЕРЖДЕНИЯ)
    // =====================================================

    bindUIEvents() {
        const btn = document.getElementById("makeGuess");

        if (!btn) return;

        btn.addEventListener("click", () => {
            this.game.finishGuess("p1");
        });
    }
}
