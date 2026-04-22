export class ScreenManager {
  constructor({ root }) {
    this.root = root;

    this.views = {
      loading: root.querySelector(".loading-screen"),
      waiting: root.querySelector(".waiting-screen"), // 🔥 НОВОЕ
      round: root.querySelector(".game-scene"),
      roundResult: root.querySelector(".round-result"),
      gameResult: root.querySelector(".game-result")
    };
  }

  show(name) {
    Object.values(this.views).forEach(el => {
      if (!el) return;
      el.classList.remove("active");
    });

    const target = this.views[name];
    if (!target) return;

    target.classList.add("active");
  }

  // =========================
  // HELPERS (необязательно, но удобно)
  // =========================
  is(name) {
    const el = this.views[name];
    return el?.classList.contains("active");
  }

  get(name) {
    return this.views[name] || null;
  }
}
