export class UIBuilder {
 constructor(config = {}) {
  this.config = config;

  this.playerColors = {
   p1: "#ff4d4d",
   p2: "#4da6ff",
   p3: "#7CFC00"
  };

  this.actualColor = "#9aa0a6";
 }

 // =========================
 // CONFIG
 // =========================

 setConfig(config) {
  this.config = config || {};
 }

 getConfig() {
  return this.config || {};
 }

 getRoundLimit() {
  return this.getConfig()?.rules?.rounds ?? 0;
 }

 getTimeLimit() {
  return this.getConfig()?.rules?.time ?? null;
 }

 getMovesLimit() {
  return this.getConfig()?.rules?.moves ?? null;
 }

 isTimeEnabled() {
  const t = this.getTimeLimit();
  return typeof t === "number" && t > 0;
 }

 isMovesEnabled() {
  const m = this.getMovesLimit();
  return typeof m === "number" && m > 0;
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
 // HUD DATA ONLY
 // =========================

 formatGameVM(state) {
  const rounds = state.rounds || [];

  const totalScore = rounds.reduce((sum, r) => {
   return sum + (r.guess?.score || 0);
  }, 0);

  return {
   round: rounds.length,
   roundLimit: this.getRoundLimit(),

   totalScore,

   time: this.getTimeLimit(),
   moves: this.getMovesLimit(),

   showTime: this.isTimeEnabled(),
   showMoves: this.isMovesEnabled()
  };
 }

 // =========================
 // ROUND RESULT DATA ONLY
 // =========================

 formatRoundVM(state) {
  const rounds = state.rounds || [];
  const round = rounds[rounds.length - 1];
  const guess = round?.guess;

  return {
   index: rounds.length - 1,
   distance: guess?.distance ?? 0,
   score: guess?.score ?? 0,
   progress: Math.min((guess?.score ?? 0) / 5000, 1),

   guess: guess
    ? {
       playerId: guess.playerId,
       lat: guess.lat,
       lng: guess.lng
      }
    : null,

   actual: round?.actualLocation || null
  };
 }

 // =========================
 // GAME RESULT DATA ONLY
 // =========================

formatGameResultVM(state) {
  const rounds = state.rounds || [];

  const totalScore = rounds.reduce((s, r) => {
    return s + (r.guess?.score || 0);
  }, 0);

  const roundsCount = this.getRoundLimit();
  const maxScore = roundsCount * 5000;

  return {
    totalScore,
    maxScore,
    progress: maxScore ? totalScore / maxScore : 0,

    rounds: rounds.map((r, i) => ({
      index: i,
      score: r.guess?.score || 0,
      distance: r.guess?.distance || 0,
      guess: r.guess,
      actual: r.actualLocation
    })),

    text: {
      title: "Игра завершена",
      scoreLine: `Счёт: ${totalScore} / ${maxScore}`,
      roundsLine: `Раундов: ${rounds.length}`
    }
  };
}
}
