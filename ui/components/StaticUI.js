export class StaticUI {
 constructor({ element }) {
  this.element = element;

  this.roundEl = element?.querySelector(".round");
  this.scoreEl = element?.querySelector(".total-score");
  this.timeEl = element?.querySelector(".time-left");
  this.movesEl = element?.querySelector(".moves-left");

  this.loading = element?.querySelector(".loading-screen");
  this.result = element?.querySelector(".guess-overview");

  this.progress = element?.querySelector(".score-progress");
  this.text = element?.querySelectorAll(".score-text p");
  this.endButtons = element?.querySelector(".game-end-buttons");
 }

 setScreen(screen) {
  if (!this.loading || !this.result) return;

  this.loading.style.display = "none";
  this.result.classList.remove("active");

  if (screen === "loading") {
   this.loading.style.display = "flex";
  }

  if (screen === "result") {
   this.result.classList.add("active");
  }
 }

 updateHUD(vm) {
  if (this.roundEl) this.roundEl.innerText = vm.roundText;
  if (this.scoreEl) this.scoreEl.innerText = vm.scoreText;
  if (this.timeEl) this.timeEl.innerText = vm.timeText;
  if (this.movesEl) this.movesEl.innerText = vm.movesText;
 }

 showRoundResult(vm) {
  this.setScreen("result");

  if (this.progress) {
   this.progress.style.width = vm.progress + "%";
  }

  if (this.text?.length >= 2) {
   this.text[0].innerText = vm.distanceText;
   this.text[1].innerText = vm.totalScoreText;
  }

  if (this.endButtons) {
   this.endButtons.style.display = "none";
  }
 }

 showGameResult(vm) {
  this.setScreen("result");

  if (this.progress) {
   this.progress.style.width = vm.progress + "%";
  }

  if (this.text?.length >= 2) {
   this.text[0].innerText = vm.lastResultText;
   this.text[1].innerText = vm.finalScoreText;
  }

  if (this.endButtons) {
   this.endButtons.style.display = "flex";
  }
 }

 showLoading() {
  this.setScreen("loading");
 }
}
