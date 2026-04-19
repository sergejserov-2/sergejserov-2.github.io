export class GameFlow {
    constructor({ game, generator, area }) {
        this.game = game;
        this.generator = generator;
        this.area = area;
    }

    async startGame() {
        this.game.startGame();
        await this.nextRound();
    }

    async nextRound() {
        const location = await this.generator.generate(this.area);
        this.game.startRound(location);
    }

    endGame() {
        this.game.endGame();
    }
}
