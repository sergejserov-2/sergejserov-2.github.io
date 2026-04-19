export class Flow {
    constructor({ game }) {
        this.game = game;
    }

    start() {
        this.game.startGame();
    }

    nextRound() {
        this.game.nextRound();
    }

    submitGuess(playerId = "p1", point) {
        this.game.setGuess(playerId, point);
    }

    finishGuess(playerId = "p1") {
        this.game.finishGuess(playerId);
    }

    endGame() {
        this.game.endGame();
    }
}
