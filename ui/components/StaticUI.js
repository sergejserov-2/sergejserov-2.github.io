export class StaticUI {
 constructor({ hudElement }) {
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
   this.roundEl.textContent = `Раунд: ${vm.round} / ${vm.roundLimit}`;
  }

  if (this.totalEl) {
   this.totalEl.textContent = `Счёт: ${vm.totalScore}`;
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
  if (this.movesEl) {
   this.movesEl.textContent = v === -1 ? "∞" : `Ходы: ${v}`;
  }
 }

 // =========================
 // ROUND + GAME RESULT (ОДИН UI)
 // =========================
 showRoundResult(model = {}) {
  this._renderResult(model, false);
 }

 showGameResult(model = {}) {
  this._renderResult(model, true);
 }

 _renderResult(model, isGameEnd) {
  const root = document.querySelector(".guess-overview");
  if (!root) return;

  const text = root.querySelector(".score-text");
  const bar = root.querySelector(".score-progress");

  if (text) {
   text.innerHTML = isGameEnd
    ? `
     <p>${model.text?.title}</p>
     <p>${model.text?.scoreLine}</p>
     <p>${model.text?.roundsLine}</p>
    `
    : `
     <p>Ваша точка на расстоянии ${model.distance.toFixed(1)} км</p>
     <p>Ваш счёт — ${model.score}</p>
    `;
  }

  if (bar) {
   bar.style.width = `${Math.min(Math.max(model.progress, 0), 1) * 100}%`;
  }

  this.stopRoundDelay();
 }

 startRoundDelay(duration, onFinish) {
  this.stopRoundDelay();

  if (!this.delayBar) return;

  const start = performance.now();

  const animate = (now) => {
   const p = 1 - (now - start) / duration;

   this.delayBar.style.transform = `scaleX(${Math.max(0, p)})`;

   if (p > 0) {
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
