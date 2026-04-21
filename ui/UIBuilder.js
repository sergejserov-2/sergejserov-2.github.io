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

 formatGameVM(state) {
  const rounds = state.rounds || [];

  const totalScore = rounds.reduce((sum, r) => {
   const g = r.guesses?.[0];
   return sum + (g?.score || 0);
  }, 0);

  const currentRound = rounds.length;
  const totalRounds = this.getRoundLimit();

  return {
   status: state.status,

   roundText: `Раунд: ${currentRound} / ${totalRounds}`,

   totalScore,
   totalText: `Счёт: ${totalScore}`,

   timeText: this.isTimeEnabled()
    ? `${this.getTimeLimit()}s`
    : "∞",

   movesText: this.isMovesEnabled()
    ? `${this.getMovesLimit()}`
    : "∞"
  };
 }

 formatRoundVM(state) {
  const rounds = state.rounds || [];

  const round = rounds[rounds.length - 1];
  const guess = round?.guesses?.[0];

  return {
   index: round?.index ?? 0,
   distance: guess?.distance ?? 0,
   score: guess?.score ?? 0,
   progress: Math.min((guess?.score ?? 0) / 5000, 1),
   guess: guess?.guess,
   actual: round?.actualLocation
  };
 }

 formatGameResultVM(state) {
  const rounds = state.rounds || [];

  return {
   totalScore: rounds.reduce((s, r) => {
    const g = r.guesses?.[0];
    return s + (g?.score || 0);
   }, 0),

   roundsCount: this.getRoundLimit(),

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
