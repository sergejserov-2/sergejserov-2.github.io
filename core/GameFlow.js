export class GameFlow {
    constructor({ game, generator, area }) {
        this.game = game;
        this.generator = generator;
        this.area = area;

        this.currentRound = 0;
    }

    async startGame() {
        this.currentRound = 0;
        this.game.startGame();

        await this.nextRound();
    }

    async nextRound() {
        const location = await this.generator.generate(this.area);

        this.game.startRound(location);

        this.currentRound++;
    }

    onGuessFinish() {
        this.game.commitRound();
    }

    async continue() {
        await this.nextRound();
    }

    endGame() {
        this.game.endGame();
    }
}
