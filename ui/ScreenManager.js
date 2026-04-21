export class ScreenManager {
 constructor({ root }) {
  this.root = root;

  this.views = {
   loading: root.querySelector(".loading-screen"),
   round: root.querySelector(".game-scene"),
   roundResult: root.querySelector(".round-result"),
   gameResult: root.querySelector(".game-result")
  };

  this.activeScreen = "loading";
 }

 // =========================
 // INIT
 // =========================
 init(initial = "loading") {
  this.activeScreen = initial;
  this.render();
 }

 // =========================
 // SHOW SCREEN
 // =========================
 show(name) {
  if (!this.views[name]) {
   console.warn(`[ScreenManager] unknown screen: ${name}`);
   return;
  }

  if (this.activeScreen === name) return;

  this.activeScreen = name;
  this.render();
 }

 // =========================
 // CORE RENDER
 // =========================
 render() {
  Object.entries(this.views).forEach(([key, el]) => {
   if (!el) return;

   const isActive = key === this.activeScreen;

   el.classList.toggle("active", isActive);
  });
 }

 // =========================
 // GET CURRENT SCREEN
 // =========================
 getActive() {
  return this.activeScreen;
 }

 // =========================
 // RESET (safe restart)
 // =========================
 reset(initial = "loading") {
  this.init(initial);
 }
}
