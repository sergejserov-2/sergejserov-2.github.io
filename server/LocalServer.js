export class LocalServer {
 constructor({ gameState }) {
  this.gameState = gameState;

  this.listeners = [];
 }

 // =========================
 // SUBSCRIBE
 // =========================

 onState(cb) {
  if (typeof cb !== "function") return;

  this.listeners.push(cb);

  // 🔥 сразу отдаём текущее состояние
  cb(this.gameState.getState());
 }

 emitState() {
  const state = this.gameState.getState();

  this.listeners.forEach(cb => cb(state));
 }

 // =========================
 // GAME FLOW (опционально)
 // =========================

 startGame() {
  this.gameState.startGame();
  this.emitState();
 }

 startRound(location) {
  this.gameState.startRound(location);
  this.emitState();
 }

 endGame() {
  this.gameState.endGame();
  this.emitState();
 }

 // =========================
 // 🔥 MAIN: HANDLE INTENT
 // =========================

 handleGuess(intent) {
  if (!intent || intent.type !== "guess") return;

  // 👉 единственная точка мутации
  this.gameState.setRoundResult(intent);

  // 👉 рассылаем обновлённый state
  this.emitState();
 }
}
