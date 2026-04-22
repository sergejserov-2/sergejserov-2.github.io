
export class StaticUI {
 constructor({ hudElement, uiBuilder }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;
  this.uiBuilder = uiBuilder;

  this.roundRoot = document.querySelector(".round-result");
  this.gameRoot = document.querySelector(".game-result");

  this.delayBar = document.querySelector(".round-timer-bar");
  this.delayFrame = null;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
 }

 updateHUD(vm = {}) {
  if (this.roundEl) {
   this.roundEl.textContent = `Раунд: ${vm.round} / ${vm.roundLimit}`;
  }

  if (this.totalEl) {
   this.totalEl.textContent = `Счёт: ${vm.totalScore}`;
  }
 }

 updateTimer(v) {
  const el = this.hudElement.querySelector(".time-left b");
  if (el) el.textContent = `Время: ${v}`;
 }

 updateMoves(v) {
  const el = this.hudElement.querySelector(".moves-left b");
  if (el) el.textContent = v === -1 ? "∞" : `Ходы: ${v}`;
 }

 // ROUND RESULT (DUEL)
 showRoundResult(vm = {}) {
  const root = this.roundRoot;
  if (!root) return;

  const text = root.querySelector(".score-text");
  const guesses = vm.guesses || [];

  if (text) {
   text.innerHTML = guesses.map(g => `
    <p>
     <b>${g.playerId}</b> — ${g.score} pts / ${g.distance.toFixed(1)} km
    </p>
   `).join("");
  }

  this.renderBars(root.querySelector(".score-view"), guesses);
 }

 // GAME RESULT
 showGameResult(vm = {}) {
  const root = this.gameRoot;
  if (!root) return;

  const players = vm.players || {};

  const list = Object.entries(players).map(([id, d]) => ({
   playerId: id,
   score: d.score
  }));

  const text = root.querySelector(".score-text");

  if (text) {
   text.innerHTML = list.map(p =>
    `<p><b>${p.playerId}</b>: ${p.score} pts</p>`
   ).join("");
  }

  this.renderBars(root.querySelector(".score-view"), list);

  this.stopRoundDelay();
 }

 renderBars(container, list) {
  if (!container) return;

  container.querySelector(".player-score-bar")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "player-score-bar";

  list.forEach(p => {
   const color = this.uiBuilder.getPlayerColor(p.playerId);

   const el = document.createElement("div");
   el.className = "player-score";

   el.innerHTML = `
    <div>${p.playerId} — ${p.score}</div>
    <div class="fill"></div>
   `;

   el.querySelector(".fill").style.width =
    `${Math.min(p.score / 5000, 1) * 100}%`;

   el.querySelector(".fill").style.background = color;

   wrap.appendChild(el);
  });

  container.appendChild(wrap);
 }

 startRoundDelay(t, cb) {
  this.stopRoundDelay();

  const start = performance.now();

  const tick = (now) => {
   const p = Math.max(0, 1 - (now - start) / t);
   this.delayBar.style.transform = `scaleX(${p})`;

   if (p > 0) {
    this.delayFrame = requestAnimationFrame(tick);
   } else {
    this.stopRoundDelay();
    cb?.();
   }
  };

  this.delayFrame = requestAnimationFrame(tick);
 }

 stopRoundDelay() {
  cancelAnimationFrame(this.delayFrame);
  this.delayFrame = null;

  if (this.delayBar) {
   this.delayBar.style.transform = "scaleX(0)";
  }
 }
}
