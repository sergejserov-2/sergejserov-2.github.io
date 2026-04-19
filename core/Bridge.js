export class Bridge {
    constructor({ game, ui }) {
        this.game = game;
        this.ui = ui;
        this.bind();
    }

    bind() {
        this.game.on("gameStarted", (state) => {
            this.ui.static?.showGame(state);
        });

        this.game.on("roundStarted", (round) => {
            this.ui.static?.updateHUD(round);
            this.ui.map?.reset?.();
        });

        this.game.on("guessFinished", (round) => {
            this.ui.static?.updateHUD(round);
        });

        this.game.on("roundCommitted", (round) => {
            this.ui.map?.lock?.();
            this.ui.map?.renderOverview?.(round);
            this.ui.static?.showRoundResult?.(round);
        });

        this.game.on("gameEnded", (state) => {
            this.ui.static?.showGameResult(state);
        });
    }
}
