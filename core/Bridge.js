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
        this.game.on("roundStarted", ({ location, round, roundCount }) => {
            this.staticUI.hideLoading();
            this.staticUI.startRound();

            this.mapUI.beginRound({ location });
            this.staticUI.updateHUD({
                round,
                roundCount,
                score: this.game.score,
                time: this.game.time,
                moves: this.game.moves
            });
        });

        // =========================
        // LIVE GUESS UPDATE
        // =========================
        this.game.on("guessUpdated", ({ point }) => {
            this.mapUI.updateGuessPreview(point);
        });

        // =========================
        // GUESS FINISHED (LOCK RESULT)
        // =========================
        this.game.on("guessFinished", ({ result, guess, actual }) => {
            this.mapUI.lockGuess();

            this.staticUI.showRoundResult({
                result,
                totalScore: this.game.score
            });
        });

        // =========================
        // ROUND ENDED (FULL SNAPSHOT)
        // =========================
        this.game.on("roundEnded", (data) => {

            this.mapUI.renderOverview({
                guess: data.guess,
                actual: data.actual
            });

            this.staticUI.showRoundResult({
                result: data.result,
                totalScore: data.totalScore
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

        if (!btn) return;

        btn.addEventListener("click", () => {
            const guess = this.mapUI.lastGuess;
            if (!guess) return;
            this.mapUI.placeGuessMarker(guess);
            this.game.finishGuess("p1");
        });
    }
}
