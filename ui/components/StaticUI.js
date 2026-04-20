export class StaticUI {
 constructor({ hudElement }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
  this.timeEl = hudElement.querySelector(".time-left b");
  this.movesEl = hudElement.querySelector(".moves-left b");

  // ROUND END TIMER (UX)
  this.timerEl = document.querySelector(".round-timer");
  this.timerFrame = null;
 }

 // =========================
 // HUD
 // =========================
 updateHUD(model = {}) {
  if (model.roundText != null) this.roundEl.textContent = model.roundText;
  if (model.totalText != null) this.totalEl.textContent = model.totalText;
 }

 // =========================
 // GAME TIMER (HUD)
 // =========================
 updateTimer(value) {
  if (!this.timeEl) return;
  this.timeEl.textContent = value === -1 ? "∞" : value;
 }

 // =========================
 // MOVES (HUD)
 // =========================
 updateMoves(value) {
  if (!this.movesEl) return;
  this.movesEl.textContent = value === -1 ? "∞" : value;
 }

 // =========================
 // ROUND RESULT
 // =========================
 showRoundResult(model = {}) {
  const root = document.querySelector(".guess-overview");
  if (!root) return;

  const distance = model.distance ?? 0;
  const score = model.score ?? 0;
  const progress = model.progress ?? 0;

  root.querySelector(".score-text").innerHTML = `
   <p>Ваша точка на расстоянии ${distance.toFixed(1)} км от загаданной</p>
   <p>Ваш счёт - ${score}</p>
  `;

  const bar = root.querySelector(".score-progress");
  if (bar) bar.style.width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
 }

 // =========================
 // GAME RESULT
 // =========================
 showGameResult(model = {}) {
  const root = document.querySelector(".guess-overview");
  if (!root) return;

  const roundsCount = Array.isArray(model.rounds)
   ? model.rounds.length
   : 0;

  root.querySelector(".score-text").innerHTML = `
   <p>Игра завершена</p>
   <p>Раундов: ${roundsCount}</p>
  `;
 }

 // =========================
 // ROUND END TIMER (UX ONLY)
 // =========================
 startRoundTimer(duration, startTime) {
  this.stopRoundTimer();

  if (!this.timerEl) return;

  this.timerEl.style.transform = "scaleX(1)";

  const animate = () => {
   const now = Date.now();
   const elapsed = now - startTime;

   const progress = Math.max(0, 1 - elapsed / duration);

   this.timerEl.style.transform = `scaleX(${progress})`;

   if (progress > 0) {
    this.timerFrame = requestAnimationFrame(animate);
   }
  };

  animate();
 }

 stopRoundTimer() {
  if (this.timerFrame) {
   cancelAnimationFrame(this.timerFrame);
   this.timerFrame = null;
  }

  if (this.timerEl) {
   this.timerEl.style.transform = "scaleX(0)";
  }
 }
}
