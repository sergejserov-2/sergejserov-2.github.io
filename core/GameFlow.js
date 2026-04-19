export class GameFlow {
    constructor({ game, area }) {
        this.game = game;
        this.area = area;

        this.running = false;
        this.locked = false;
    }

    start() {
        if (this.running) return;

        this.running = true;
        this.game.startGame();
        this.nextRound();
    }

    async nextRound() {
        if (!this.running) return;

        this.locked = false;
        await this.game.startRound(this.area);
    }

    submitGuess(playerId, point) {
        if (!this.running || this.locked) return;
        this.game.setGuess(playerId, point);
    }

    finishGuess(playerId = "p1") {
        if (!this.running || this.locked) return;

        this.locked = true;

        this.game.finishGuess(playerId);
        this.game.commitRound();

        if (this.isLastRound()) {
            this.end();
            return;
        }

        setTimeout(() => this.nextRound(), 1200);
    }

    end() {
        this.running = false;
        this.game.endGame();
    }

    isLastRound() {
        const s = this.game.state;
        return s.currentRoundIndex >= s.rounds.length;
    }
}
