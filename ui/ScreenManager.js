export class ScreenManager {
 constructor({ root }) {
  this.root = root;

  this.views = {
   loading: root.querySelector(".loading-screen"),
   round: root.querySelector(".game-scene"),
   roundResult: root.querySelector(".guess-overview"),
   gameResult: root.querySelector(".guess-overview")
  };
 }

 show(name) {
  Object.values(this.views).forEach(v => {
   if (!v) return;
   v.classList.remove("active");
   v.style.display = "none";
  });

  const target = this.views[name];
  if (!target) return;

  target.style.display = "flex";
  target.classList.add("active");
 }
}
