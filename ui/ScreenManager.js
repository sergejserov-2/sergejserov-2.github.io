export class ScreenManager {
 constructor({ root }) {
  this.root = root;

  this.views = {
   loading: root.querySelector(".loading-screen"),
   round: root.querySelector(".game-scene"), // НЕ используется как screen, оставляем только как reference
   roundResult: root.querySelector(".round-result"),
   gameResult: root.querySelector(".game-result")
  };

  // ⚠️ важно: game-scene не является overlay-screen
  this.overlayScreens = ["loading", "roundResult", "gameResult"];
 }

 // =========================
 // INIT STATE
 // =========================

 initLoading(show = true) {
  if (!this.views.loading) return;

  this.views.loading.classList.toggle("active", show);
 }

 // =========================
 // SHOW SCREEN
 // =========================

 show(name) {
  if (!this.views[name]) {
   console.warn(`[ScreenManager] unknown screen: ${name}`);
   return;
  }

  // ❗ ВСЕ overlay выключаем
  for (const key of this.overlayScreens) {
   const el = this.views[key];
   if (!el) continue;
   el.classList.remove("active");
  }

  // ❗ включаем только нужный overlay
  const target = this.views[name];
  target.classList.add("active");

  // 🔥 game-scene никогда не трогаем
 }

 // =========================
 // HIDE ALL OVERLAYS
 // =========================

 hideAll() {
  for (const key of this.overlayScreens) {
   const el = this.views[key];
   if (!el) continue;
   el.classList.remove("active");
  }
 }

 // =========================
 // GAME FLOW HELPERS
 // =========================

 showLoading() {
  this.initLoading(true);
 }

 hideLoading() {
  this.initLoading(false);
 }

 showRoundResult() {
  this.show("roundResult");
 }

 showGameResult() {
  this.show("gameResult");
 }
}
