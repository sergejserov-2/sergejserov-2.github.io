export class ScreenManager {
 constructor({ screensElement }) {
  this.screensElement = screensElement;

  this.loading = screensElement.querySelector(".loading-screen");
  this.roundResult = screensElement.querySelector(".round-result");
  this.gameResult = screensElement.querySelector(".game-result");
 }

 setScreen(screen) {
  [this.loading, this.roundResult, this.gameResult].forEach(el => {
   if (el) el.style.display = "none";
  });

  switch (screen) {
   case "loading":
    if (this.loading) this.loading.style.display = "flex";
    break;

   case "result":
    if (this.roundResult) this.roundResult.style.display = "flex";
    break;

   case "gameover":
    if (this.gameResult) this.gameResult.style.display = "flex";
    break;
  }
 }
}
