export class UIBuilder {
 constructor(config = {}) {
  this.config = config;

  this.playerColors = {
   p1: "#ff4d4d",
   p2: "#4da6ff",
   p3: "#7CFC00"
  };

  this.actualColor = "#161a22";
 }

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
  return this.getTimeLimit() > 0;
 }

 isMovesEnabled() {
  return this.getMovesLimit() > 0;
 }

 getPlayerColor(id) {
  return this.playerColors[id] || "#ff4d4d";
 }

 getActualColor() {
  return this.actualColor;
 }

 // =========================
 // HUD
 // =========================

 formatGameVM(state) {
  const rounds = state.rounds || [];

  const totalScore = rounds.reduce((sum, r) => {
   return sum + (r.guesses || []).reduce((a, g) => a + (g.score || 0), 0);
  }, 0);

  return {
   round: rounds.length,
   roundLimit: this.getRoundLimit(),
   totalScore,
   showTime: this.isTimeEnabled(),
   showMoves: this.isMovesEnabled()
  };
 }

 // =========================
 // ROUND
 // =========================

 formatRoundVM(state) {
  const round = state.rounds.at(-1);

  return {
   actual: round?.actualLocation,
   guesses: round?.guesses || []
  };
 }

}
