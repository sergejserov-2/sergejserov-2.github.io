export class UIBuilder {

 constructor(config) {
  this.config = config;

  this.playerColors = {
   p1: "#ff4d4d",
   p2: "#4da6ff",
   p3: "#7CFC00"
  };

  this.actualColor = "#9aa0a6";
 }

 // =========================
 // CONFIG HELPERS
 // =========================

 getRoundLimit() {
  return this.config?.rules?.rounds ?? 0;
 }

 getTimeLimit() {
  return this.config?.rules?.time ?? -1;
 }

 getMovesLimit() {
  return this.config?.rules?.moves ?? -1;
 }

 isTimeEnabled() {
  return this.getTimeLimit() !== -1;
 }

 isMovesEnabled() {
  return this.getMovesLimit() !== -1;
 }

 // =========================
 // COLORS
 // =========================

 getPlayerColor(id = "p1") {
  return this.playerColors[id] || "#ff4d4d";
 }

 getActualColor() {
  return this.actualColor;
 }

 // =========================
 // GAME HUD
 // =========================

 formatGameVM(state) {
  const totalScore = state.rounds.reduce((sum, r) => {
   const g = r.guesses?.[0];
   return sum + (g?.score || 0);
  }, 0);

  const currentRound = state.currentRoundIndex + 1;
  const totalRounds = this.getRoundLimit();

  return {
   status: state.status,

   // раунды
   currentRoundIndex: state.currentRoundIndex,
   roundText: `Раунд: ${currentRound} / ${totalRounds}`,

   // счёт
   totalScore,
   totalText: `Счёт: ${totalScore}`,

   // =========================
   // RULES DISPLAY (NEW)
   // =========================

   timeText: this.isTimeEnabled()
    ? `${this.getTimeLimit()}s`
    : "∞",

   movesText: this.isMovesEnabled()
    ? `${this.getMovesLimit()}`
    : "∞",

   limits: {
    rounds: totalRounds,
    time: this.getTimeLimit(),
    moves: this.getMovesLimit()
   }
  };
 }

 // =========================
 // ROUND RESULT
 // =========================

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

 // =========================
 // GAME RESULT
 // =========================

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
