export class StaticUI {
 constructor({ hudElement }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
  this.timeEl = hudElement.querySelector(".time-left b");
  this.movesEl = hudElement.querySelector(".moves-left b");

  this.timerFrame = null;
  this.timerEl = null; // 🔥 больше не кешируем DOM навсегда
 }

 // =========================
 // HUD
 // =========================

 updateHUD(vm = {}) {
  if (this.roundEl) {
   this.roundEl.textContent =
    `Раунд: ${vm.round} / ${vm.roundLimit}`;
  }

  if (this.totalEl) {
   this.totalEl.textContent =
    `Счёт: ${vm.totalScore}`;
  }

  const timeWrap = this.timeEl?.parentElement;
  if (timeWrap) {
   timeWrap.style.display = vm.showTime ? "block" : "none";
  }

  const movesWrap = this.movesEl?.parentElement;
  if (movesWrap) {
   movesWrap.style.display = vm.showMoves ? "block" : "none";
  }
 }

 // =========================
 // TIMER TEXT
 // =========================

 updateTimer(value) {
  if (!this.timeEl) return;
  this.timeEl.textContent = `Время: ${value}`;
 }

 updateMoves(value) {
  if (!this.movesEl) return;
  this.movesEl.textContent =
   value === -1 ? "∞" : `Ходы: ${value}`;
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

  const text = root.querySelector(".score-text");

  if (text) {
   text.innerHTML = `
    <p>Ваша точка на расстоянии ${distance.toFixed(1)} км от загаданной</p>
    <p>Ваш счёт — ${score}</p>
   `;
  }

  const bar = root.querySelector(".score-progress");
  if (bar) {
   bar.style.width =
    `${Math.min(Math.max(progress, 0), 1) * 100}%`;
  }
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

  const text = root.querySelector(".score-text");

  if (text) {
   text.innerHTML = `
    <p>Игра завершена</p>
    <p>Раундов: ${roundsCount}</p>
   `;
  }

  const bar = root.querySelector(".score-progress");
  if (bar) {
   bar.style.width = "100%";
  }

  this.stopRoundTimer();
 }

 // =========================
 // TIMER BAR
 // =========================

 getTimerEl() {
  return document.querySelector(".round-timer-bar");
 }

 startRoundTimer(duration, onFinish) {
  this.stopRoundTimer();

  const el = this.getTimerEl();
  if (!el) return;

  this.timerEl = el;

  el.style.transition = "none";
  el.style.transform = "scaleX(1)";

  const start = performance.now();

  const animate = (now) => {
   const progress = Math.max(0, 1 - (now - start) / duration);

   el.style.transform = `scaleX(${progress})`;

   if (progress > 0) {
    this.timerFrame = requestAnimationFrame(animate);
   } else {
    this.stopRoundTimer();
    onFinish?.();
   }
  };

  this.timerFrame = requestAnimationFrame(animate);
 }

 stopRoundTimer() {
  if (this.timerFrame) {
   cancelAnimationFrame(this.timerFrame);
   this.timerFrame = null;
  }

  if (this.timerEl) {
   this.timerEl.style.transition = "none";
   this.timerEl.style.transform = "scaleX(0)";
  }
 }
}
