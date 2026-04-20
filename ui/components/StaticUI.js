export class StaticUI {
 constructor({ hudElement }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
  this.timeEl = hudElement.querySelector(".time-left b");
  this.movesEl = hudElement.querySelector(".moves-left b");
 }

 updateHUD(model = {}) {
  if (model.roundText != null) this.roundEl.textContent = model.roundText;
  if (model.totalText != null) this.totalEl.textContent = model.totalText;
  if (model.timeText != null) this.timeEl.textContent = model.timeText;
  if (model.movesText != null) this.movesEl.textContent = model.movesText;
 }

 showRoundResult(model = {}) {
  const root = document.querySelector(".guess-overview");
  if (!root) return;

  const distance = model.distance ?? 0;
  const score = model.score ?? 0;
  const progress = model.progress ?? 0;

  root.querySelector(".score-text").innerHTML = `
   <p>${distance.toFixed(1)} km</p>
   <p>${score} pts</p>
  `;

  const bar = root.querySelector(".score-progress");
  if (bar) bar.style.width = `${Math.min(Math.max(progress, 0), 1) * 100}%`;
 }

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
}
