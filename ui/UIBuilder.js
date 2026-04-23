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

  const totalScore = rounds.reduce((s, r) => {
   return s + (r.guesses?.reduce((a, g) => a + (g.score || 0), 0) || 0);
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
 // ROUND (🔥 ВАЖНО)
 // =========================
 formatRoundVM(state) {
  const round = state.rounds.at(-1);

  return {
   actual: round?.actualLocation || null,

   guesses: (round?.guesses || []).map(g => ({
    playerId: g.playerId,
    lat: g.lat,
    lng: g.lng,
    distance: g.distance || 0,
    score: g.score || 0
   }))
  };
 }

 // =========================
 // GAME RESULT
 // =========================
 formatGameResultVM(state) {
  const rounds = state.rounds || [];

  const players = {};

  rounds.forEach(r => {
   (r.guesses || []).forEach(g => {
    if (!players[g.playerId]) {
     players[g.playerId] = { score: 0 };
    }
    players[g.playerId].score += g.score || 0;
   });
  });

  return { players, rounds };
 }
}
