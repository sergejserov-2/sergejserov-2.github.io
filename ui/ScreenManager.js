export class ScreenManager {
 constructor({ root }) {
  this.root = root;

  this.views = {
   loading: root.querySelector(".loading-screen"),
   round: document.querySelector(".game-scene"),
   roundResult: root.querySelector(".round-result"),
   gameResult: root.querySelector(".game-result")
  };
 }

 show(name) {
  Object.values(this.views).forEach(v => {
   if (!v) return;
   v.style.display = "none";
  });

  const target = this.views[name];
  if (!target) return;

  // game-scene — базовый слой
  if (name === "round") {
   target.style.display = "block";
   return;
  }

  // overlay экраны
  target.style.display = "flex";
 }
}
