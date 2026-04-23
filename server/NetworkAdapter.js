export class NetworkAdapter {
 constructor(transport, playerId = "p1") {
  this.transport = transport;
  this.playerId = playerId;

  this.listeners = {
   guess: [],
   roundComplete: []
  };

  this.bind();
 }

 // =========================
 // BIND TRANSPORT → ADAPTER
 // =========================
 bind() {
  this.transport.on("guess", (data) => {
   this.listeners.guess.forEach(cb => cb(data));
  });

  this.transport.on("roundComplete", (data) => {
   this.listeners.roundComplete.forEach(cb => cb(data));
  });
 }

 // =========================
 // OUTGOING (GAMEFLOW → NETWORK)
 // =========================
 sendGuess({ playerId, guess }) {
  this.transport.emit("guess", {
   playerId,
   guess
  });
 }

 sendRoundComplete(payload = {}) {
  this.transport.emit("roundComplete", payload);
 }

 // =========================
 // INCOMING (NETWORK → GAMEFLOW)
 // =========================
 onGuess(cb) {
  this.listeners.guess.push(cb);
 }

 onRoundComplete(cb) {
  this.listeners.roundComplete.push(cb);
 }
}
