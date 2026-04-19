export class GameState {
    constructor() { this.reset(); }

    reset() {
        this.status = "idle";
        this.currentRoundIndex = 0;
        this.currentRound = null;
        this.rounds = [];
    }

    startRound(actualLocation) {
        this.currentRound = {
            index: this.currentRoundIndex + 1,
            actualLocation,
            guesses: [],
            result: null
        };
        this.status = "active";
    }

    addGuess(playerId, guess) {
        if (!this.currentRound) return;
        this.currentRound.guesses.push({
            playerId,
            guess,
            distance: null,
            score: null
        });
    }

    setGuessResult(playerId, result) {
        if (!this.currentRound) return;
        const g = this.currentRound.guesses.find(x => x.playerId === playerId);
        if (!g) return;
        g.distance = result.distance;
        g.score = result.score;
    }

    finishRound(result) {
        if (!this.currentRound) return;
        this.currentRound.result = result;
    }

    commitRound() {
        if (!this.currentRound) return;
        this.rounds.push(this.currentRound);
        this.currentRoundIndex++;
        this.currentRound = null;
    }

    endGame() {
        this.status = "ended";
    }

    isActive() {
        return this.status === "active";
    }

    getCurrentRound() {
        return this.currentRound;
    }

    getLastRound() {
        return this.rounds[this.rounds.length - 1] || null;
    }

    toJSON() {
        return {
            status: this.status,
            currentRoundIndex: this.currentRoundIndex,
            currentRound: this.currentRound,
            rounds: this.rounds
        };
    }
}
