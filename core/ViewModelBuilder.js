export class ViewModelBuilder {

 buildHUD(state, round) {
  return {
   roundText: `Раунд: ${round.index + 1}/${state.rounds.length}`,
   scoreText: `Счёт: ${this.getTotalScore(state)}`
  };
 }

 buildRoundVM(state, round) {
  const guess = round.guesses?.[0];

  const distance = guess?.distance ?? 0;
  const score = guess?.score ?? 0;

  return {
   distanceText: `Вы в ${distance} км от места`,
   scoreText: `Счёт: ${score}`,
   totalScoreText: `Итог: ${this.getTotalScore(state)}`,
   progress: this.getProgress(score)
  };
 }

 buildGameVM(state) {
  const lastRound = state.rounds?.at(-1);
  const guess = lastRound?.guesses?.[0];

  const total = this.getTotalScore(state);
  const rounds = state.rounds.length || 1;

  return {
   lastResultText: `Последний результат: ${guess?.distance ?? 0} км`,
   finalScoreText: `Итоговый счёт: ${total}`,
   progress: this.getProgress(total, rounds * 5000)
  };
 }

 getTotalScore(state) {
  return state.rounds.reduce((sum, r) => {
   return sum + (r.guesses?.[0]?.score || 0);
  }, 0);
 }

 getProgress(value, max = 5000) {
  return Math.min((value / max) * 100, 100);
 }
}
