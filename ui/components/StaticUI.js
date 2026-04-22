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

  const text = root.querySelector(".score-text");
  const container = root.querySelector(".score-view");

  const guesses = vm.guesses || [];

  this.renderPlayerBars(container, guesses);

  // текст больше вторичен — но оставим для дебага
  if (text) {
   text.innerHTML = guesses.map(g => {
    return `
     <p>
      <b>${g.playerId}</b> — 
      ${g.distance.toFixed(1)} км — 
      ${g.score} / 5000
     </p>
    `;
   }).join("");
  }
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

  this.renderPlayerBars(container, list);

  if (text) {
   text.innerHTML = list.map(p => `
    <p><b>${p.playerId}</b>: ${p.score} очков</p>
   `).join("");
  }

  this.stopRoundDelay();
 }

 // =========================
 // PLAYER BARS (CORE DUEL UI)
 // =========================

 renderPlayerBars(container, list = []) {
  if (!container) return;

  container.querySelector(".player-score-bar")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "player-score-bar";

  const MAX_SCORE = 5000;

  list.forEach(p => {
   const color = this.uiBuilder.getPlayerColor(p.playerId);

   const score = p.score ?? 0;
   const distance = p.distance ?? null;

   const percent = Math.min(score / MAX_SCORE, 1) * 100;

   const el = document.createElement("div");
   el.className = "player-score";

   el.style.position = "relative";
   el.style.margin = "8px 0";
   el.style.padding = "8px 10px";
   el.style.borderRadius = "8px";
   el.style.overflow = "hidden";
   el.style.background = "rgba(255,255,255,0.08)";

   el.innerHTML = `
    <div style="
      position: relative;
      z-index: 2;
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: white;
    ">
      <span>${p.playerId}</span>
      <span>${distance !== null ? distance.toFixed(1) + " km" : ""}</span>
      <span>${score} / ${MAX_SCORE}</span>
    </div>

    <div class="fill"></div>
   `;

   const fill = el.querySelector(".fill");

   fill.style.position = "absolute";
   fill.style.left = "0";
   fill.style.top = "0";
   fill.style.height = "100%";
   fill.style.width = `${percent}%`;
   fill.style.background = color;
   fill.style.opacity = "0.35";
   fill.style.transition = "width 0.4s ease";

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
