export class ScreenManager {
 constructor({ screensElement }) {
  if (!screensElement) {
   throw new Error("ScreenManager: screensElement is required");
  }

  this.screensElement = screensElement;

  this.loading = screensElement.querySelector(".loading-screen");
  this.result = screensElement.querySelector(".guess-overview");
 }

 setScreen(screen) {
  this.screensElement.dataset.screen = screen;

  if (this.loading) this.loading.style.display = "none";
  if (this.result) this.result.style.display = "none";

  switch (screen) {
   case "loading":
    if (this.loading) this.loading.style.display = "block";
    break;

   case "result":
    if (this.result) this.result.style.display = "block";
    break;

   case "round":
   default:
    break;
  }
 }
}
