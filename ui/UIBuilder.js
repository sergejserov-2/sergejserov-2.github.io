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

 getPlayerColor(id = "p1") {
  return this.playerColors[id] || "#ff4d4d";
 }

 getActualColor() {
  return this.actualColor;
 }

 // =========================
 // PLAYER AGGREGATION (DUEL CORE)
 // =========================
 getPlayerStats(state) {
  const rounds = state.rounds || [];

  const stats = {};

  for (const r of rounds) {
   const guesses = r.guesses?.length ? r.guesses : (r.guess ? [r.guess] : []);

   for (const g of guesses) {
    const id = g.playerId || "p1";

    if (!stats[id]) {
     stats[id] = {
      playerId: id,
      score: 0,
      distance: 0,
      rounds: 0
     };
    }

    stats[id].score += g.score || 0;
    stats[id].distance += g.distance || 0;
   }
  }

  return Object.values(stats);
 }

 // =========================
 // HUD (SOLO SAFE)
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

   showTime: this.isTimeEnabled(),
   showMoves: this.isMovesEnabled()
  };
 }

 // =========================
 // ROUND RESULT (DUEL READY)
 // =========================
 formatRoundVM(state) {
  const rounds = state.rounds || [];
  const round = rounds[rounds.length - 1];

  if (!round) {
   return {
    players: [],
    actual: null
   };
  }

  const guesses = round.guesses?.length
   ? round.guesses
   : (round.guess ? [round.guess] : []);

  const players = guesses.map(g => ({
   playerId: g.playerId,
   lat: g.lat,
   lng: g.lng,
   distance: g.distance,
   score: g.score,
   color: this.getPlayerColor(g.playerId)
  }));

  return {
   actual: round.actualLocation || null,
   players,
   totalPlayersScore: players.reduce((s, p) => s + (p.score || 0), 0)
  };
 }

 // =========================
 // GAME RESULT (DUEL FULL AGGREGATION)
 // =========================
 formatGameResultVM(state) {
  const playerStats = this.getPlayerStats(state);

  const rounds = state.rounds || [];

  const maxScore = rounds.length * 5000;

  const totalScore = playerStats.reduce((s, p) => s + p.score, 0);

  return {
   players: playerStats.map(p => ({
    ...p,
    color: this.getPlayerColor(p.playerId)
   })),

   totalScore,
   maxScore,
   progress: maxScore ? totalScore / maxScore : 0,

   rounds: rounds.map((r, i) => ({
    index: i,
    guesses: r.guesses || (r.guess ? [r.guess] : []),
    actual: r.actualLocation
   }))
  };
 }
}
