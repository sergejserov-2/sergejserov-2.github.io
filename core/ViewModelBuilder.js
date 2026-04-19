export class ViewModelBuilder {

    buildHUD(state, round) {
        return {
            roundText: `Раунд: ${round.index + 1}/${state.rounds.length + 1}`,
            scoreText: `Счёт: ${this.getTotalScore(state)}`
        };
    }
    
    buildRoundVM(state, round) {
        const g = round.guesses?.[0];
        const score = g?.score ?? 0;
        
        return {
            distanceText: `Вы в ${g?.distance ?? 0} км от места`,
            scoreText: `Счёт: ${score}`,
            totalScoreText: `Итог: ${this.getTotalScore(state)}`,
            progress: Math.min((score / 5000) * 100, 100)
        };
    }
    
    buildGameVM(state) {
        const last = state.rounds?.at?.(-1);
        const g = last?.guesses?.[0];
        
        const total = this.getTotalScore(state);
        const rounds = state.rounds.length || 1;
    
        return {
            lastResultText: `Последний результат: ${g?.distance ?? 0} км`,
            finalScoreText: `Итоговый счёт: ${total}`,
            progress: Math.min((total / (5000 * rounds)) * 100, 100)
        };
    }
        
    getTotalScore(state) {
        return state.rounds.reduce(
        (sum, r) => sum + (r.result?.score || 0),
        0
        );
    }
}
