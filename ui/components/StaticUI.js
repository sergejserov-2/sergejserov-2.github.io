export class StaticUI {
 constructor({ hudElement }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
  this.timeEl = hudElement.querySelector(".time-left b");
  this.movesEl = hudElement.querySelector(".moves-left b");
 }

 updateHUD(model) {
  if (model.roundText) this.roundEl.textContent = model.roundText;
  if (model.totalText) this.totalEl.textContent = model.totalText;
  if (model.timeText) this.timeEl.textContent = model.timeText;
  if (model.movesText) this.movesEl.textContent = model.movesText;
 }

 showRoundResult(model) {
  const root = document.querySelector(".round-result");
  if (!root) return;

  root.querySelector(".score-text").innerHTML = `
   <p>${model.distance} km</p>
   <p>${model.score} pts</p>
  `;

  const bar = root.querySelector(".score-progress");
  if (bar) bar.style.width = `${model.progress * 100}%`;
 }

 showGameResult(model) {
  const root = document.querySelector(".game-result");
  if (!root) return;

  root.querySelector(".score-text").innerHTML = `
   <p>Игра завершена</p>
   <p>Раундов: ${model.rounds}</p>
  `;
 }
}
