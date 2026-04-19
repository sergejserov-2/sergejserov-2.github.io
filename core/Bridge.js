export class Bridge {
    constructor({ game, mapUI, staticUI }) {
        this.game = game;
        this.mapUI = mapUI;
        this.staticUI = staticUI;

        this.bindGameEvents();
        this.bindMapEvents();
        this.bindUIEvents();
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

        this.game.on("roundStarted", ({ location }) => {
            this.staticUI.hideLoading();
            this.staticUI.startRound();
            this.mapUI.startRound({ location });
            this.mapUI.enableGuessMode();
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
            this.staticUI.showRoundResult(data);

            this.mapUI.renderOverview({
                guess: this.game.getCurrentGuess(),
                actual: this.game.current
            });
        });

        this.game.on("gameEnded", (data) => {
            this.staticUI.showGameResult(data);
        });
    }

    // =====================================================
    // MAP → GAME
    // =====================================================

    bindMapEvents() {
        this.mapUI.onGuess((point) => {
            this.game.setGuess("p1", point);
        });
    }

    // =====================================================
    // UI → GAME (BUTTONS)
    // =====================================================

    bindUIEvents() {
        const btn = document.getElementById("makeGuess");

        if (btn) {
            btn.addEventListener("click", () => {
                const guess = this.mapUI.lastGuess;

                if (!guess) return;

                this.mapUI.placeGuessMarker(guess);
                this.game.finishGuess("p1");
            });
        }
    }
}
