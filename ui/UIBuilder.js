export class UIBuilder {

 constructor() {
  this.playerColors = {
   p1: "#ff4d4d",
   p2: "#4da6ff",
   p3: "#7CFC00"
  };

  this.actualColor = "#9aa0a6";
 }

 getPlayerColor(id = "p1") {
  return this.playerColors[id] || "#ff4d4d";
 }

 getActualColor() {
  return this.actualColor;
 }

 formatGameVM(state) {
  const totalScore = state.rounds.reduce((sum, r) => {
   const g = r.guesses?.[0];
   return sum + (g?.score || 0);
  }, 0);

  return {
   status: state.status,
   currentRoundIndex: state.currentRoundIndex,
   totalScore,
   roundText: `Раунд: <b>${state.currentRoundIndex + 1}</b>`,
   totalText: `Счёт: <b>${totalScore}</b>`,
   progress: 0
  };
 }

 formatRoundVM(state) {
  const round = state.rounds[state.currentRoundIndex];
  const guess = round?.guesses?.[0];

  return {
   index: round?.index,
   distance: guess?.distance ?? 0,
   score: guess?.score ?? 0,
   progress: Math.min((guess?.score ?? 0) / 5000, 1),
   guess: guess?.guess,
   actual: round?.actualLocation
  };
 }

 formatGameResultVM(state) {
  return {
   totalScore: state.rounds.reduce((s, r) => {
    const g = r.guesses?.[0];
    return s + (g?.score || 0);
   }, 0),

   roundsCount: state.rounds.length,

   rounds: state.rounds.map(r => {
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
