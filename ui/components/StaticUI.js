export class StaticUI {
 constructor({ element }) {
  this.element = element;

  this.roundEl = element.querySelector(".round b");
  this.totalEl = element.querySelector(".total-score b");
  this.progressEl = element.querySelector(".progress");
 }

 setScreen(screen) {
  document.body.dataset.screen = screen;
 }

 updateHUD(hud) {
  this.roundEl.textContent = hud.roundText;
  this.totalEl.textContent = hud.totalText;

  if (this.progressEl) {
   this.progressEl.style.width = `${hud.progress * 100}%`;
  }
 }

 showRoundResult(vm) {
  console.log("ROUND RESULT", vm);
 }

 showGameResult(vm) {
  console.log("GAME RESULT", vm);
 }
}
