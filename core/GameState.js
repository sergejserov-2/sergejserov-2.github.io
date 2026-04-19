export class GameState {
    constructor() {
        this.status = "idle"; // idle | active | ended
        this.rounds = [];
        this.currentRound = null;
        this.currentRoundIndex = 0;
    }

    // =========================
    // round = {
    //   index: number,
    //   actualLocation: { lat, lng },
    //   guesses: [
    //     { playerId, guess, distance, score }
    //   ],
    //   result: { distance, score } | null
    // }
    // =========================

    reset() {
        this.status = "idle";
        this.rounds = [];
        this.currentRound = null;
        this.currentRoundIndex = 0;
    }

    startRound(actualLocation) {
        this.currentRound = {
            index: this.currentRoundIndex,
            actualLocation,
            guesses: [],
            result: null
        };
        this.rounds.push(this.currentRound);
    }

    setGuess(playerId, point) {
        if (!this.currentRound) return;

        const g = this.currentRound.guesses.find(x => x.playerId === playerId);

        if (g) g.guess = point;
        else this.currentRound.guesses.push({
            playerId,
            guess: point,
            distance: null,
            score: null
        });
    }

    getGuess(playerId) {
        return this.currentRound?.guesses.find(g => g.playerId === playerId) || null;
    }

    applyGuessResult(playerId, result) {
        const g = this.getGuess(playerId);
        if (!g) return;

        g.distance = result.distance;
        g.score = result.score;
    }

    finishRound(result) {
        if (this.currentRound) this.currentRound.result = result;
    }

    commitRound() {
        this.currentRoundIndex++;
        this.currentRound = null;
    }

    endGame() {
        this.status = "ended";
    }
}
