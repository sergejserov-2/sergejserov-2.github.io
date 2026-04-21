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
 // INIT (CRITICAL FIX)
 // =========================
 init(initial = "loading") {
  this.activeScreen = initial;

  Object.entries(this.views).forEach(([name, el]) => {
   if (!el) return;

   const isActive = name === initial;

   el.hidden = !isActive;
   el.classList.toggle("active", isActive);
  });
 }

 // =========================
 // SHOW SCREEN (CORE API)
 // =========================
 show(name) {
  if (!this.views[name]) {
   console.warn([ScreenManager] unknown screen: ${name});
   return;
  }

  if (this.activeScreen === name) return;

  this.activeScreen = name;

  Object.entries(this.views).forEach(([key, el]) => {
   if (!el) return;

   const isActive = key === name;

   el.hidden = !isActive;
   el.classList.toggle("active", isActive);
  });
 }

 // =========================
 // GET STATE (optional debug)
 // =========================
 getActive() {
  return this.activeScreen;
 }

 // =========================
 // RESET (safe restart game)
 // =========================
 reset() {
  this.init("loading");
 }
}
