export class StaticUI {
 constructor({ hudElement }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
  this.timeEl = hudElement.querySelector(".time-left b");
  this.movesEl = hudElement.querySelector(".moves-left b");

  this.delayBar = document.querySelector(".round-timer-bar");

  this.delayFrame = null;
 }

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
  if (timeWrap) timeWrap.style.display = vm.showTime ? "block" : "none";

  const movesWrap = this.movesEl?.parentElement;
  if (movesWrap) movesWrap.style.display = vm.showMoves ? "block" : "none";
 }

 updateTimer(v) {
  if (this.timeEl) this.timeEl.textContent = `Время: ${v}`;
 }

 updateMoves(v) {
  if (this.movesEl) this.movesEl.textContent =
   v === -1 ? "∞" : `Ходы: ${v}`;
 }

 // =========================
 // ROUND RESULT (UNCHANGED)
 // =========================
 showRoundResult(model = {}) {
  const root = document.querySelector(".guess-overview");
  if (!root) return;

  const text = root.querySelector(".score-text");
  const bar = root.querySelector(".score-progress");

  if (text) {
   text.innerHTML = `
    <p>Ваша точка на расстоянии ${model.distance.toFixed(1)} км от загаданной</p>
    <p>Ваш счёт — ${model.score}</p>
   `;
  }

  if (bar) {
   bar.style.width =
    `${Math.min(Math.max(model.progress, 0), 1) * 100}%`;
  }
 }

 // =========================
 // GAME RESULT (ROUND UX + EXTRA LINES)
 // =========================
 showGameResult(model = {}) {
  const root = document.querySelector(".guess-overview");
  if (!root) return;

  const text = root.querySelector(".score-text");
  const bar = root.querySelector(".score-progress");

  if (text) {
   text.innerHTML = `
    <p>${model.text?.title}</p>
    <p>${model.text?.scoreLine}</p>
    <p>${model.text?.roundsLine}</p>
   `;
  }

  if (bar) {
   const p = Math.min(Math.max(model.progress, 0), 1);
   bar.style.width = `${p * 100}%`;
  }

  this.stopRoundDelay();
 }

 // =========================
 // DELAY BAR
 // =========================
 startRoundDelay(duration, onFinish) {
  this.stopRoundDelay();

  if (!this.delayBar) return;

  this.delayBar.style.transition = "none";
  this.delayBar.style.transform = "scaleX(1)";

  const start = performance.now();

  const animate = (now) => {
   const t = Math.max(0, 1 - (now - start) / duration);
   this.delayBar.style.transform = `scaleX(${t})`;

   if (t > 0) {
    this.delayFrame = requestAnimationFrame(animate);
   } else {
    this.stopRoundDelay();
    onFinish?.();
   }
  };

  this.delayFrame = requestAnimationFrame(animate);
 }

 stopRoundDelay() {
  if (this.delayFrame) cancelAnimationFrame(this.delayFrame);
  this.delayFrame = null;

  if (this.delayBar) {
   this.delayBar.style.transform = "scaleX(0)";
  }
 }
}
