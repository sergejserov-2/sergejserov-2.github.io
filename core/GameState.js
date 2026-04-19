export class GameState {
    constructor() {
        this.status = "idle";
        this.currentRoundIndex = 0;
        this.rounds = [];
    }

    start() {
        this.status = "active";
        this.rounds = [];
        this.currentRoundIndex = 0;
    }

    startRound(actualLocation) {
        this.rounds.push({
            index: this.currentRoundIndex,
            actualLocation,
            guesses: []
        });
    }

    getCurrentRound() {
        return this.rounds[this.currentRoundIndex];
    }

    addGuess(playerId, guess, result) {
        const round = this.getCurrentRound();

        round.guesses.push({
            playerId,
            guess,
            distance: result.distance,
            score: result.score
        });
    }

    commitRound() {
        this.currentRoundIndex++;
    }

    end() {
        this.status = "ended";
    }

    getState() {
        return {
            status: this.status,
            currentRoundIndex: this.currentRoundIndex,
            rounds: this.rounds
        };
    }
        reset() {
         this.status = "idle";
         this.currentRoundIndex = 0;
         this.rounds = [];
    }
}
