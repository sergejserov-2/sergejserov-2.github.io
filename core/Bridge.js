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

        this.game.on("roundStarted", ({ round, roundCount, location }) => {

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
            this.mapUI.disableGuessMode();
            this.staticUI.showRoundResult(result);
            this.mapUI.placeGuessMarker(this.game.getCurrentGuess());
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
            this.game.finishGuess("p1");
        });
    }
}
