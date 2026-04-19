export class ViewModelBuilder {
    constructor(game) {
        this.game = game;
    }

    buildHUD(round) {
        const state = this.game.state;

        return {
            roundText: `Раунд: ${round.index + 1}`,
            scoreText: `Счёт: ${this.getTotalScore(state)}`
        };
    }

    buildRoundVM(round) {
        const g = round.guesses?.[0];
        const score = g?.score ?? 0;

        return {
            distanceText: `Вы в ${g?.distance ?? 0} км от места`,
            scoreText: `Счёт: ${score}`,
            totalScoreText: `Итог: ${this.getTotalScore(this.game.state)}`,
            progress: (score / 5000) * 100
        };
    }

    buildGameVM(state) {
        const last = state.rounds?.at?.(-1);

        return {
            lastRoundText: `Последний результат: ${last?.guesses?.[0]?.distance ?? 0} км`,
            finalScoreText: `Итоговый счёт: ${this.getTotalScore(state)}`,
            progress: this.getTotalScore(state) /
                (5000 * (state.rounds.length || 1))
        };
    }

    getTotalScore(state) {
        return state.rounds.reduce(
            (sum, r) => sum + (r.result?.score || 0),
            0
        );
    }
}
