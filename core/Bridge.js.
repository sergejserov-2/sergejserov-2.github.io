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

        // GAME START
        this.game.on("gameStarted", () => {
            this.staticUI.showGame();
        });

        // ROUND LOADING
        this.game.on("roundLoading", () => {
            this.staticUI.showLoading();
        });

        // ROUND READY
        this.game.on("roundReady", ({ round }) => {
            this.staticUI.showRoundReady(round);
        });

        // ROUND STARTED
        this.game.on("roundStarted", ({ round, roundCount, location }) => {
            this.staticUI.hideLoading();
            this.staticUI.startRound();

            this.mapUI.clearGuessMarker();
            this.mapUI.clearOverview();

            this.mapUI.enableGuessMode();

            this.staticUI.updateHUD(
                this.game.getHUDState()
            );
        });

        // HUD TICK
        this.game.on("hudUpdated", (hud) => {
            this.staticUI.updateHUD(hud);
        });

        // GUESS RESULT
        this.game.on("guessFinished", ({ result }) => {
            this.mapUI.disableGuessMode();

            this.staticUI.showRoundResult(result);

            this.mapUI.renderOverview({
                guess: this.game.players.p1.lastGuess,
                actual: this.game.current
            });
        });

        // ROUND END
        this.game.on("roundEnded", (data) => {
            this.staticUI.showRoundResult(data);
        });

        // GAME END
        this.game.on("gameEnded", (data) => {
            this.staticUI.showGameResult(data);
        });
    }

    // =====================================================
    // MAP → GAME
    // =====================================================

    bindMapEvents() {

        this.mapUI.onGuess((point) => {
            this.game.players.p1.lastGuess = point;
            this.game.finishGuess("p1");
        });
    }
}
