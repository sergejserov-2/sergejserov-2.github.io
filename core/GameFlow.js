export class GameFlow {
    constructor({ game, area }) {
        this.game = game;
        this.area = area;
        this.roundDelay = 1500;
    }

    // FLOW: start → startGame → round loop → guessFinished → commit → next/end
    async start() {
        this.game.startGame();
        await this.nextRound();
    }

    async nextRound() {
        await this.game.startRound(this.area.getNext?.() || this.area);
        this.bind();
    }

    bind() {
        const h = async () => {
            this.game.off?.("guessFinished", h);
            this.game.commitRound();
            if (this.isLast()) return this.game.endGame();
            await this.delay(this.roundDelay);
            await this.nextRound();
        };
        this.game.on("guessFinished", h);
    }

    isLast() {
        return this.game.state.currentRoundIndex >= (this.area.roundsCount || 10);
    }

    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
}
