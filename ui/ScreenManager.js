export class ScreenManager {
  constructor({ root }) {
    this.root = root;

    this.views = {
      loading: root.querySelector(".loading-screen"),
      round: root.querySelector(".game-scene"),
      roundResult: root.querySelector(".round-result"),
      gameResult: root.querySelector(".game-result")
    };
  }

  // =========================
  // SHOW SCREEN
  // =========================
  show(name) {
    Object.entries(this.views).forEach(([key, el]) => {
      if (!el) return;

      el.classList.remove("active");
      el.style.display = "none";
    });

    const target = this.views[name];

    if (!target) {
      console.warn("[ScreenManager] unknown screen:", name);
      return;
    }

    target.style.display = "flex";
    target.classList.add("active");
  }
