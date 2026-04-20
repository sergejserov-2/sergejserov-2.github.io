export class UIBuilder {

 formatGameVM(state) {
  const currentRound =
   state.rounds[state.currentRoundIndex];

  const totalScore =
   state.rounds.reduce((sum, r) => {
    const g = r.guesses?.[0];
    return sum + (g?.score || 0);
   }, 0);

  return {
   status: state.status,
   currentRoundIndex: state.currentRoundIndex,

   totalScore,

   roundText: `Раунд: ${state.currentRoundIndex + 1}`,
   totalText: `Счёт: ${totalScore}`,

   timeText: "",
   movesText: "",

   progress: 0
  };
 }

 formatRoundVM(state) {
  const round =
   state.rounds[state.currentRoundIndex];

  const guess = round?.guesses?.[0];

  const score = guess?.score ?? 0;
  const distance = guess?.distance ?? 0;

  return {
   index: round.index,

   distance,
   score,

   progress: Math.min(score / 5000, 1),

   guess: guess?.guess,
   actual: round.actualLocation
  };
 }

 formatGameResultVM(state) {
  const rounds = state.rounds;

  return {
   totalScore: rounds.reduce((sum, r) => {
    const g = r.guesses?.[0];
    return sum + (g?.score || 0);
   }, 0),

   roundsCount: rounds.length,

   rounds: rounds.map(r => {
    const g = r.guesses?.[0];

    return {
     index: r.index,
     distance: g?.distance ?? 0,
     score: g?.score ?? 0,
     guess: g?.guess,
     actual: r.actualLocation,
     progress: (g?.score ?? 0) / 5000
    };
   })
  };
 }
}
