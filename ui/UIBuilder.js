export class UIBuilder {

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
   progress: this.getProgress(score, 5000)
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
   progress: this.getProgress(total, 5000 * rounds)
  };
 }

 getTotalScore(state) {
  return state.rounds.reduce(
   (sum, r) => sum + (r.result?.score || 0),
   0
  );
 }

 getProgress(value, max) {
  return Math.min((value / max) * 100, 100);
 }
}
