export class StaticUI {
 constructor({ hudElement, uiBuilder }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;
  this.uiBuilder = uiBuilder;

  this.roundRoot = document.querySelector(".round-result");
  this.gameRoot = document.querySelector(".game-result");

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");

  this.delayBar = document.querySelector(".round-timer-bar");
  this.delayFrame = null;
 }

 // =========================
 // HUD
 // =========================

 updateHUD(vm = {}) {
  if (this.roundEl) {
   this.roundEl.textContent = `Раунд: ${vm.round} / ${vm.roundLimit}`;
  }

  if (this.totalEl) {
   this.totalEl.textContent = `Счёт: ${vm.totalScore}`;
  }
 }

 updateTimer(value) {
  const el = this.hudElement.querySelector(".time-left b");
  if (el) el.textContent = `Время: ${value}`;
 }

 updateMoves(value) {
  const el = this.hudElement.querySelector(".moves-left b");
  if (!el) return;
  el.textContent = value === -1 ? "∞" : `Ходы: ${value}`;
 }

 // =========================
 // ROUND RESULT (MULTIPLAYER)
 // =========================

 showRoundResult(vm = {}) {
  const root = this.roundRoot;
  if (!root) return;

  const container = root.querySelector(".score-view");
  const text = root.querySelector(".score-text");

  const guesses = vm.guesses || [];

  // =========================
  // TEXT: ВСЕ ИГРОКИ
  // =========================
  if (text) {
   text.innerHTML = guesses.map(g => {
    const distance = (g.distance ?? 0).toFixed(1);
    const score = g.score ?? 0;

    return `
     <p>
      <b>${g.playerId}</b>: расстояние ${distance} км, очки ${score}
     </p>
    `;
   }).join("");
  }

  // =========================
  // BARS
  // =========================
  this.renderPlayerBars(container, guesses);
 }

 // =========================
 // GAME RESULT (MULTIPLAYER)
 // =========================

 showGameResult(vm = {}) {
  const root = this.gameRoot;
  if (!root) return;

  const container = root.querySelector(".score-view");
  const text = root.querySelector(".score-text");

  const players = vm.players || {};

  const list = Object.entries(players).map(([playerId, data]) => ({
   playerId,
   score: data.score || 0
  }));

  if (text) {
   text.innerHTML = list.map(p => {
    return `<p><b>${p.playerId}</b>: итоговые очки ${p.score}</p>`;
   }).join("");
  }

  this.renderPlayerBars(container, list);

  this.stopRoundDelay();
 }

 // =========================
 // PLAYER BARS
 // =========================

 renderPlayerBars(container, guesses = []) {
  if (!container) return;

  const old = container.querySelector(".player-score-bar");
  if (old) old.remove();

  const wrap = document.createElement("div");
  wrap.className = "player-score-bar";

  guesses.forEach(g => {
   const color = this.uiBuilder.getPlayerColor(g.playerId);

   const el = document.createElement("div");
   el.className = "player-score";

   const score = g.score ?? 0;
   const distance = g.distance ?? null;

   el.innerHTML = `
    <div class="player-score-label">
     ${g.playerId} — ${score} pts
     ${distance !== null ? ` / ${distance.toFixed(1)} km` : ""}
    </div>
    <div class="player-score-fill"></div>
   `;

   const fill = el.querySelector(".player-score-fill");
   fill.style.width = `${Math.min(score / 5000, 1) * 100}%`;
   fill.style.background = color;

   wrap.appendChild(el);
  });

  container.appendChild(wrap);
 }

 // =========================
 // ROUND DELAY BAR
 // =========================

 startRoundDelay(duration, onFinish) {
  this.stopRoundDelay();

  if (!this.delayBar) return;

  this.delayBar.style.transition = "none";
  this.delayBar.style.transform = "scaleX(1)";

  const start = performance.now();

  const animate = (now) => {
   const progress = Math.max(0, 1 - (now - start) / duration);

   this.delayBar.style.transform = `scaleX(${progress})`;

   if (progress > 0) {
    this.delayFrame = requestAnimationFrame(animate);
   } else {
    this.stopRoundDelay();
    onFinish?.();
   }
  };

  this.delayFrame = requestAnimationFrame(animate);
 }

 stopRoundDelay() {
  if (this.delayFrame) {
   cancelAnimationFrame(this.delayFrame);
   this.delayFrame = null;
  }

  if (this.delayBar) {
   this.delayBar.style.transform = "scaleX(0)";
  }
 }
}
