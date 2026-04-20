export class StaticUI {
 constructor({ hudElement }) {
  if (!hudElement) {
   throw new Error("StaticUI: hudElement is required");
  }

  this.hudElement = hudElement;

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");
  this.timeEl = hudElement.querySelector(".time-left b");
  this.movesEl = hudElement.querySelector(".moves-left b");

  this.progressEl = document.querySelector(".score-progress");

  if (!this.roundEl || !this.totalEl) {
   throw new Error("StaticUI: HUD structure is invalid");
  }
 }

 setScreen(screen) {
  document.body.dataset.screen = screen;
 }

 updateHUD(hud) {
  if (hud.roundText) {
   this.roundEl.textContent = hud.roundText;
  }

  if (hud.totalText) {
   this.totalEl.textContent = hud.totalText;
  }

  if (hud.timeText && this.timeEl) {
   this.timeEl.textContent = hud.timeText;
  }

  if (hud.movesText && this.movesEl) {
   this.movesEl.textContent = hud.movesText;
  }

  if (this.progressEl && typeof hud.progress === "number") {
   this.progressEl.style.width = `${hud.progress * 100}%`;
  }
 }

 showRoundResult(vm) {
  console.log("ROUND RESULT VM:", vm);
 }

 showGameResult(vm) {
  console.log("GAME RESULT VM:", vm);
 }
}
