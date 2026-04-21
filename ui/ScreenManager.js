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
    // скрываем все экраны
    Object.values(this.views).forEach((el) => {
      if (!el) return;
      el.classList.remove("active");
    });

    const target = this.views[name];

    if (!target) {
      console.warn("[ScreenManager] unknown screen:", name);
      return;
    }

    target.classList.add("active");
  }

  // =========================
  // OPTIONAL HELPERS
  // =========================

  hide(name) {
    const el = this.views[name];
    if (el) el.classList.remove("active");
  }

  hideAll() {
    Object.values(this.views).forEach((el) => {
      if (!el) return;
      el.classList.remove("active");
    });
  }

  getActive() {
    return Object.entries(this.views)
      .find(([_, el]) => el?.classList.contains("active"))?.[0] || null;
  }
}
