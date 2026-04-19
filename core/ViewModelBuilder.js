export class ViewModelBuilder {
    constructor(game) {
        this.game = game;
    }

    buildHUD(round) {
        const state = this.game.getState();

        return {
            roundText: `Раунд: ${round.index + 1}`,
            scoreText: `Счёт: ${state.totalScore ?? 0}`,
            timeText: `Время: ${state.time ?? 0}`,
            movesText: `Шагов: ${state.moves ?? 0}`
        };
    }

    buildRoundVM(round) {
        const g = round.guesses?.[0];
        const score = g?.score ?? 0;
        const total = this.game.getState().totalScore ?? 0;

        return {
            distanceText: `Вы в ${g?.distance ?? 0} км от места`,
            scoreText: `Счёт: ${score}`,
            totalScoreText: `Итог: ${total}`,
            progress: (score / 5000) * 100
        };
    }

    buildGameVM(state) {
        const last = state.rounds?.at?.(-1);

        return {
            lastRoundText: `Последний результат: ${last?.guesses?.[0]?.distance ?? 0} км`,
            finalScoreText: `Итоговый счёт: ${state.totalScore ?? 0}`,
            progress: (state.totalScore / (5000 * (state.rounds.length || 1))) * 100
        };
    }
}
