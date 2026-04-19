export class StaticUI {
constructor({ element }) {
this.element = element;

this.roundEl = element.querySelector(".round");
this.scoreEl = element.querySelector(".total-score");
this.timeEl = element.querySelector(".time-left");
this.movesEl = element.querySelector(".moves-left");

this.loading = element.querySelector(".loading-screen");
this.result = element.querySelector(".guess-overview");

this.progress = document.querySelector(".score-progress");
this.text = document.querySelectorAll(".score-text p");
this.endButtons = element.querySelector(".game-end-buttons");
}

/* hud */
updateHUD(vm) {
if (this.roundEl) this.roundEl.innerHTML = vm.roundText;
if (this.scoreEl) this.scoreEl.innerHTML = vm.scoreText;
if (this.timeEl) this.timeEl.innerHTML = vm.timeText;
if (this.movesEl) this.movesEl.innerHTML = vm.movesText;
}

/* loading */
showLoading() { this.loading && (this.loading.style.display = "flex"); }
hideLoading() { this.loading && (this.loading.style.display = "none"); }

/* round */
startRound() {
this.hideLoading();
this.hideResult();
}

/* result */
showRoundResult(vm) {
this.showResult();

if (this.progress) this.progress.style.width = vm.progress + "%";

if (this.text?.length >= 2) {
this.text[0].innerText = vm.line1;
this.text[1].innerText = vm.line2;
}

if (this.endButtons) this.endButtons.style.display = "none";
}

showGameResult(vm) {
this.showResult();

if (this.progress) this.progress.style.width = vm.progress + "%";

if (this.text?.length >= 2) {
this.text[0].innerText = vm.line1;
this.text[1].innerText = vm.line2;
}

if (this.endButtons) this.endButtons.style.display = "flex";
}

/* screens */
showResult() { this.result?.classList.add("active"); }
hideResult() { this.result?.classList.remove("active"); }
}
