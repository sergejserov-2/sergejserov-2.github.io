export class LocalServer {
 constructor({ game }) {
  this.game = game;

  this.listeners = {};

  this.connected = false;
 }

 // =========================
 // EVENT SYSTEM
 // =========================
 on(event, cb) {
  (this.listeners[event] ||= []).push(cb);
 }

 emit(event, data) {
  this.listeners[event]?.forEach(cb => cb(data));
 }

 // =========================
 // LIFECYCLE
 // =========================
 connect() {
  this.connected = true;

  // 🔥 сразу отправляем текущее состояние
  this.emit("stateUpdated", this.game.getState());
 }

 disconnect() {
  this.connected = false;
 }

 // =========================
 // GAME ACTIONS
 // =========================

 sendStartGame() {
  this.game.startGame();

  this.emit("stateUpdated", this.game.getState());
 }

 sendStartRound(location) {
  this.game.startRound(location);

  this.emit("stateUpdated", this.game.getState());
 }

 sendGuess({ playerId, guess }) {
  if (!this.connected) return;

  const result = this.game.setGuess(playerId, guess);
  if (!result) return;

  // 🔥 сервер пересобирает state и пушит всем
  this.emit("stateUpdated", this.game.getState());
 }

 sendRoundComplete() {
  this.emit("roundCompleted", this.game.getState());
 }
}
