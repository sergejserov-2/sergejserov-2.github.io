import { Emitter } from "./Emitter.js";

export class Game extends Emitter {
    constructor({ gameState, generator, scoring }) {
        super();
        this.state = gameState;
        this.generator = generator;
        this.scoring = scoring;
        this.isLocked = false;
    }

    startGame() {
        this.state.reset();
        this.state.status = "active";
        this.fire("gameStarted");
    }

    async startRound(area) {
        const location = await this.generator.generate(area);
        this.state.startRound(location);
        this.isLocked = false;
        this.fire("roundStarted", {
            round: this.state.currentRound.index,
            actual: location
        });
    }

    setGuess(playerId, point) {
        if (!this.state.currentRound || this.isLocked) return;
        this.state.addGuess(playerId, point);
        this.fire("guessUpdated", { playerId, guess: point });
    }

    finishGuess(playerId = "p1") {
        if (this.isLocked) return;

        const round = this.state.currentRound;
        if (!round) return;

        const guessObj = round.guesses.find(g => g.playerId === playerId);
        if (!guessObj) return;

        const result = this.scoring.calculateResult({
            guess: guessObj.guess,
            actual: round.actualLocation
        });

        guessObj.distance = result.distance;
        guessObj.score = result.score;

        this.state.finishRound(result);
        this.isLocked = true;

        this.fire("roundEnded", {
            round: round.index,
            result,
            totalScore: this.getTotalScore(),
            guess: guessObj.guess,
            actual: round.actualLocation
        });
    }

    commitRound() {
        this.state.commitRound();
    }

    endGame() {
        this.state.endGame();
        this.fire("gameEnded", {
            totalScore: this.getTotalScore(),
            rounds: this.state.rounds
        });
    }

    getTotalScore() {
        return this.state.rounds.reduce((s, r) => s + (r.result?.score || 0), 0);
    }
}
