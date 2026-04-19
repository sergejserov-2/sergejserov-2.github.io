export class Bridge {
    constructor({ game, ui }) {
        this.game = game;
        this.ui = ui;
        this.bind();
    }

    bind() {
        this.game.on("gameStarted", () => this.ui.static.showGame());
        this.game.on("roundStarted", (d) => this.onRoundStarted(d));
        this.game.on("guessFinished", (d) => this.onGuessFinished(d));
        this.game.on("roundCommitted", (d) => this.onRoundCommitted(d));
        this.game.on("gameEnded", (d) => this.ui.static.showGameResult(d));
    }

    onRoundStarted(data) {
        this.ui.static.updateHUD(data);
        this.ui.map.reset?.();
        this.ui.street.setLocation?.(data.actual);
    }

    onGuessFinished(data) {
        this.ui.static.updateHUD(data);
        this.ui.map.clearGuess?.();
    }

    onRoundCommitted(data) {
        this.ui.static.showRoundResult(data);
        this.ui.map.showResult?.(data);
    }
}
