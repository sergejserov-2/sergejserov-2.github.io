export class NetworkAdapter {
 constructor(transport, playerId = "p1") {
  this.transport = transport;
  this.playerId = playerId;

  this.listeners = {
   guess: [],
   roundComplete: [],
   state: []
  };

  this.bind();
 }

 bind() {
  this.transport.on("guess", (data) => {
   this.listeners.guess.forEach(cb => cb(data));
  });

  this.transport.on("roundComplete", (data) => {
   this.listeners.roundComplete.forEach(cb => cb(data));
  });

  this.transport.on("state", (state) => {
   this.listeners.state.forEach(cb => cb(state));
  });
 }

 sendGuess({ playerId, guess, roundId }) {
  this.transport.emit("guess", {
   playerId,
   guess,
   roundId
  });
 }

 sendRoundComplete(payload = {}) {
  this.transport.emit("roundComplete", payload);
 }

 onGuess(cb) {
  this.listeners.guess.push(cb);
 }

 onRoundComplete(cb) {
  this.listeners.roundComplete.push(cb);
 }

 onState(cb) {
  this.listeners.state.push(cb);
 }
}
