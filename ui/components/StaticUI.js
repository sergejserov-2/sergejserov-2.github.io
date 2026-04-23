export class StaticUI {
 constructor({ hudElement, uiBuilder }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;
  this.uiBuilder = uiBuilder;

  this.roundRoot = document.querySelector(".round-result");
  this.gameRoot = document.querySelector(".game-result");

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");

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
  if (el) el.textContent = `Ходы: ${value}`;
 }

 // =========================
 // ROUND RESULT
 // =========================
 showRoundResult(vm = {}) {
  const root = this.roundRoot;
  if (!root) return;

  const container = root.querySelector(".players-score");

  this.renderPlayerBars(container, vm.guesses || []);
 }

 // =========================
 // GAME RESULT
 // =========================
 showGameResult(vm = {}) {
  const root = this.gameRoot;
  if (!root) return;

  const container = root.querySelector(".players-score");

  const list = Object.entries(vm.players || {}).map(([playerId, data]) => ({
   playerId,
   score: data.score || 0,
   distance: 0
  }));

  this.renderPlayerBars(container, list);

  this.stopRoundDelay();
 }

 // =========================
 // PLAYER BARS
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
   const distance = p.distance ?? 0;

   const percent = Math.min(score / MAX_SCORE, 1) * 100;

   const el = document.createElement("div");
   el.className = "player-score";

   el.innerHTML = `
    <div style="display:flex;justify-content:space-between;color:white;font-size:13px;">
     <span>${p.playerId}</span>
     <span>${distance.toFixed(1)} km</span>
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

   el.style.position = "relative";
   el.style.overflow = "hidden";
   el.style.padding = "10px";
   el.style.margin = "8px 0";
   el.style.borderRadius = "8px";
   el.style.background = "rgba(255,255,255,0.08)";

   wrap.appendChild(el);
  });

  container.appendChild(wrap);
 }

 // =========================
 // ROUND TIMER BAR (FIXED)
 // =========================
 startRoundDelay(duration, onFinish) {
  this.stopRoundDelay();

  const bar = this.roundRoot?.querySelector(".round-timer-bar");
  if (!bar) return;

  bar.style.transform = "scaleX(1)";

  const start = performance.now();

  const animate = (now) => {
   const progress = Math.max(0, 1 - (now - start) / duration);

   bar.style.transform = `scaleX(${progress})`;

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

  const bar = this.roundRoot?.querySelector(".round-timer-bar");
  if (bar) bar.style.transform = "scaleX(0)";
 }
}
