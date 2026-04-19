export class Bridge {
    constructor({ game, ui }) {
        this.ui = ui;
        this.bind(game);
    }

    bind(game) {
        game.on("gameStarted", (state) => this.ui.static.showGame(state));

        game.on("roundStarted", (round) => {
            this.ui.static.updateHUD(round);
            this.ui.map.reset?.();
            this.ui.street.setLocation?.(round.actualLocation);
        });

        game.on("guessFinished", (round) => {
            this.ui.static.updateHUD(round);
            this.ui.map.lock?.();
        });

        game.on("roundCommitted", (round) => {
            this.ui.static.showRoundResult(round);
            this.ui.map.showResult?.(round);
        });

        game.on("gameEnded", (state) => {
            this.ui.static.showGameResult(state);
        });
    }
}
