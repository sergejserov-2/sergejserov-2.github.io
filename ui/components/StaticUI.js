export class StaticUI {
  constructor({ hudElement }) {
    if (!hudElement) throw new Error("StaticUI: missing hud");

    this.hudElement = hudElement;

    this.roundEl = hudElement.querySelector(".round b");
    this.totalEl = hudElement.querySelector(".total-score b");
    this.timeEl = hudElement.querySelector(".time-left b");
    this.movesEl = hudElement.querySelector(".moves-left b");

    this.delayBar = document.querySelector(".round-timer-bar");

    this.delayFrame = null;
  }

  // =========================
  // ROUND RESULT
  // =========================
  showRoundResult(model = {}, root) {
    if (!root) return;

    const text = root.querySelector(".score-text");
    const bar = root.querySelector(".score-progress");

    if (text) {
      text.innerHTML = `
        <p>Ваша точка на расстоянии ${model.distance.toFixed(1)} км от загаданной</p>
        <p>Ваш счёт — ${model.score}</p>
      `;
    }

    if (bar) {
      bar.style.width = `${model.progress * 100}%`;
    }
  }

  // =========================
  // GAME RESULT
  // =========================
  showGameResult(model = {}, root) {
    if (!root) return;

    const text = root.querySelector(".score-text");
    const bar = root.querySelector(".score-progress");

    if (text) {
      text.innerHTML = `
        <p>${model.text?.title ?? "Игра завершена"}</p>
        <p>${model.text?.scoreLine ?? ""}</p>
        <p>${model.text?.roundsLine ?? ""}</p>
      `;
    }

    if (bar) {
      bar.style.width = `${model.progress * 100}%`;
    }

    this.stopRoundDelay();
  }
}
