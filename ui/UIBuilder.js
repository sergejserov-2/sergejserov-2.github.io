export class UIBuilder {

 buildHUD(round) {
  return {
   roundText: `Раунд: ${round.index + 1}`
  };
 }

 buildRoundVM(round, result) {
  const g = round.guesses?.[0];

  const distance = g?.distance ?? result.distance ?? 0;
  const score = g?.score ?? result.score ?? 0;

  return {
   distanceText: `Вы в ${distance} км от места`,
   totalScoreText: `Счёт: ${score}`,
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
  return state.rounds.reduce((sum, r) => {
   const g = r.guesses?.[0];
   return sum + (g?.score || 0);
  }, 0);
 }

 getProgress(value, max) {
  return Math.min((value / max) * 100, 100);
 }
}
