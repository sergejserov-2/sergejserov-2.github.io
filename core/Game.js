import { Emitter } from "./Emitter.js";

export class Game extends Emitter {
    constructor({ gameState, generator, scoring }) {
        super();
        this.state = gameState;
        this.generator = generator;
        this.scoring = scoring;
        this.isLocked = false;
    }

    // старт игры
    startGame() {
        this.state.reset();
        this.state.status = "active";
        this.fire("gameStarted");
    }

    // старт раунда (вызывается GameFlow)
    async startRound(area) {
        const location = await this.generator.generate(area);

        this.state.startRound(location);
        this.isLocked = false;

        this.fire("roundStarted", {
            round: this.state.currentRound.index,
            roundCount: this.state.rounds.length + 1,
            actual: location
        });
    }

    // обновление текущего выбора игрока
    setGuess(playerId, point) {
        if (!this.state.currentRound || this.isLocked) return;

        this.state.setGuess(playerId, point);

        this.fire("guessUpdated", {
            playerId,
            guess: point
        });
    }

    // финализация угадывания
    finishGuess(playerId = "p1") {
        if (this.isLocked) return;

        const round = this.state.currentRound;
        if (!round) return;

        const guess = this.state.getGuess(playerId);
        if (!guess) return;

        // чистый расчёт (без побочных эффектов)
        const result = this.scoring.calculateResult({
            guess: guess.guess,
            actual: round.actualLocation
        });

        // единственное место мутации результата
        this.state.applyGuessResult(playerId, result);

        this.isLocked = true;

        this.fire("guessFinished", {
            round: round.index,
            result,
            totalScore: this.getTotalScore(),
            guess: guess.guess,
            actual: round.actualLocation
        });
    }

    // фиксация раунда в историю
    commitRound() {
        this.state.commitRound();

        this.fire("roundCommitted", {
            totalScore: this.getTotalScore()
        });
    }

    // завершение игры
    endGame() {
        this.state.endGame();

        this.fire("gameEnded", {
            totalScore: this.getTotalScore(),
            rounds: this.state.rounds
        });
    }

    // общий счёт
    getTotalScore() {
        return this.state.rounds.reduce(
            (sum, r) => sum + (r.result?.score || 0),
            0
        );
    }
}
