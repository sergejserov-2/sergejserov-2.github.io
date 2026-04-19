export class Bridge {
    constructor({ game, ui }) {
        this.game = game;
        this.ui = ui;
        this.bind();
    }

    bind() {
        this.game.on("gameStarted", (state) => {
            this.ui.static.showGame(state);
        });

        this.game.on("roundStarted", (round) => {
            this.ui.static.updateHUD(this.buildHUD(round));
            this.ui.map?.reset?.();
        });

        this.game.on("guessFinished", (round) => {
            this.ui.static.updateHUD(this.buildHUD(round));
        });

        this.game.on("roundCommitted", (round) => {
            this.ui.map?.lock?.();
            this.ui.map?.renderOverview?.(round);
            this.ui.static.showRoundResult(this.buildRoundVM(round));
        });

        this.game.on("gameEnded", (state) => {
            this.ui.static.showGameResult(this.buildGameVM(state));
        });
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
        const guess = round.guesses?.[0];
        const distance = guess?.distance ?? 0;
        const score = guess?.score ?? 0;
        const total = this.game.getState().totalScore ?? 0;

        return {
            distanceText: `Вы в ${distance} км от места`,
            scoreText: `Счёт: ${score}`,
            totalScoreText: `Итог: ${total}`,
            progress: (score / 5000) * 100
        };
    }

    buildGameVM(state) {
        const last = state.history?.at?.(-1);

        return {
            lastRoundText: `Последний результат: ${last?.distance ?? 0} км`,
            finalScoreText: `Итоговый счёт: ${state.totalScore ?? 0}`,
            progress: (state.totalScore / (5000 * (state.roundCount || 1))) * 100
        };
    }
}
