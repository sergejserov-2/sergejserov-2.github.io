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
    // GAME → UI (PURE RENDER MAPPING)
    // =====================================================

    bindGameEvents() {

        // =========================
        // GAME START
        // =========================
        this.game.on("gameStarted", () => {
            this.staticUI.showGame();
            this.staticUI.updateHUD(this.game.getHUDState());
        });

        // =========================
        // ROUND START
        // =========================
        this.game.on("roundStarted", ({ location }) => {
            this.staticUI.hideLoading();
            this.staticUI.startRound();

            // 💥 ONLY VISUAL RESET
            this.mapUI.beginRound({ location });

            this.staticUI.updateHUD(this.game.getHUDState());
        });

        // =========================
        // GUESS UPDATED (LIVE STATE)
        // =========================
        this.game.on("guessUpdated", ({ point }) => {
            this.mapUI.updateGuessPreview(point);
        });

        // =========================
        // GUESS FINISHED (FINAL LOCK)
        // =========================
        this.game.on("guessFinished", ({ result }) => {
            this.mapUI.lockGuess();

            this.staticUI.showRoundResult({
                result,
                totalScore: this.game.score
            });
        });

        // =========================
        // ROUND ENDED (OVERVIEW)
        // =========================
        this.game.on("roundEnded", (data) => {
            this.mapUI.renderOverview({
                guess: this.game.getCurrentGuess(),
                actual: this.game.current
            });
        });

        // =========================
        // GAME ENDED
        // =========================
        this.game.on("gameEnded", (data) => {
            this.staticUI.showGameResult(data);
        });
    }

    // =====================================================
    // MAP → GAME (INPUT ONLY)
    // =====================================================

    bindMapEvents() {
        this.mapUI.onGuess((point) => {
            this.game.setGuess("p1", point);
        });
    }

    // =====================================================
    // UI → GAME (BUTTONS ONLY)
    // =====================================================

    bindUIEvents() {
        const btn = document.getElementById("makeGuess");

        if (btn) {
            btn.addEventListener("click", () => {
                const guess = this.mapUI.lastGuess;

                if (!guess) return;

                // 💥 ONLY VISUAL
                this.mapUI.placeGuessMarker(guess);

                // 💥 GAME DECIDES EVERYTHING ELSE
                this.game.finishGuess("p1");
            });
        }
    }
}
