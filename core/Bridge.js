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
    // GAME FLOW (MAIN SCENARIO)
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
            console.log("[BRIDGE] roundStarted");

            this.staticUI.hideLoading();
            this.staticUI.startRound();

            // 💥 FULL VISUAL RESET FOR NEW ROUND
            this.mapUI.beginRound({
                location
            });

            this.staticUI.updateHUD(this.game.getHUDState());
        });

        // =========================
        // GUESS MADE (GAME STATE UPDATED)
        // =========================
        this.game.on("guessUpdated", ({ point }) => {
            console.log("[BRIDGE] guessUpdated", point);

            // optional visual feedback
            this.mapUI.updateGuessPreview(point);
        });

        // =========================
        // GUESS FINISHED
        // =========================
        this.game.on("guessFinished", ({ result }) => {
            console.log("[BRIDGE] guessFinished");

            this.mapUI.lockGuess();

            this.staticUI.showRoundResult({
                result,
                totalScore: this.game.score
            });
        });

        // =========================
        // ROUND END
        // =========================
        this.game.on("roundEnded", (data) => {
            console.log("[BRIDGE] roundEnded");

            this.mapUI.renderOverview({
                guess: this.game.getCurrentGuess(),
                actual: this.game.current
            });
        });

        // =========================
        // GAME END
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
            console.log("[BRIDGE] map guess", point);

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

                console.log("[BRIDGE] submit guess");

                this.mapUI.placeGuessMarker(guess);

                this.game.finishGuess("p1");
            });
        }
    }
}
