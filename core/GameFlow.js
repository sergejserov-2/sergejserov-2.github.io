export class GameFlow {
    constructor({ game, generator, streetView, emitter, maxRetries = 10 }) {
        this.game = game;
        this.generator = generator;
        this.streetView = streetView;
        this.emitter = emitter;
        this.maxRetries = maxRetries;
    }

    startGame() {
        this.game.start();
        this.emitter.emit("gameStarted", this.game.getState());
        this.startRound();
    }

    async startRound() {
        const area = this.game.getCurrentArea();
        let point = null;
        let tries = 0;

        while (tries < this.maxRetries) {
            const candidate = this.generator.generate(area);
            const ok = await this.streetView.trySetLocation(candidate);
            if (ok) {
                point = candidate;
                break;
            }
            tries++;
        }

        if (!point) throw new Error("Failed to find valid StreetView point");

        this.game.startRound(point);
        this.emitter.emit("roundStarted", this.game.getCurrentRound());
    }

    onGuessFinished(data) {
        this.game.finishGuess(data);
        const round = this.game.getCurrentRound();
        this.emitter.emit("guessFinished", round);
        this.commitRound();
    }

    commitRound() {
        this.game.commitRound();
        const round = this.game.getCurrentRound();
        this.emitter.emit("roundCommitted", round);
        if (this.game.isLastRound()) this.endGame();
        else this.startRound();
    }

    endGame() {
        this.game.end();
        this.emitter.emit("gameEnded", this.game.getState());
    }
}
