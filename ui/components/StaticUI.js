export class StaticUI {
 constructor({ hudElement, uiBuilder }) {
  if (!hudElement) throw new Error("StaticUI: missing hud");

  this.hudElement = hudElement;
  this.uiBuilder = uiBuilder;

  this.roundRoot = document.querySelector(".round-result");
  this.gameRoot = document.querySelector(".game-result");

  this.roundEl = hudElement.querySelector(".round b");
  this.totalEl = hudElement.querySelector(".total-score b");

  this.delayFrame = null;
 }

 updateHUD(vm = {}) {
  if (this.roundEl) {
   this.roundEl.textContent = `Раунд: ${vm.round} / ${vm.roundLimit}`;
  }

  if (this.totalEl) {
   this.totalEl.textContent = `Счёт: ${vm.totalScore}`;
  }
 }

updateTimer(value) {
  const root = this.hudElement.querySelector(".time-left");
  const el = root?.querySelector("b");

  if (!root || !el) return;

  if (value == null || value < 0) {
    root.style.display = "none";
    return;
  }

  root.style.display = "";
  el.textContent = `Время: ${value}`;
}

updateMoves(value) {
  const root = this.hudElement.querySelector(".moves-left");
  const el = root?.querySelector("b");

  if (!root || !el) return;

  if (value == null || value < 0) {
    root.style.display = "none";
    return;
  }

  root.style.display = "";
  el.textContent = `Ходы: ${value}`;
}

resetHUD() {
  const timeRoot = this.hudElement.querySelector(".time-left");
  const movesRoot = this.hudElement.querySelector(".moves-left");

  if (timeRoot) timeRoot.style.display = "none";
  if (movesRoot) movesRoot.style.display = "none";
}

 
 // =========================
 // ROUND RESULT
 // =========================

 showRoundResult(vm = {}) {
    console.log("RoundinStaticUI");
  const root = this.roundRoot;
  if (!root) return;

  const container = root.querySelector(".players-score");

  const guesses = vm.guesses || [];

  this.renderPlayerBars(container, guesses);
 }

 // =========================
 // GAME RESULT
 // =========================

showGameResult(vm = {}) {
  const root = this.gameRoot;
  if (!root) return;

  const container = root.querySelector(".players-score");

  this.renderPlayerBars(
    container,
    vm.guesses || [],
    vm.players || {} // 🔥 ВАЖНО
  );

  this.stopRoundDelay();
}

 // =========================
 // PLAYER BARS
 // =========================

 renderPlayerBars(container, list = [], totals = {}) {
  if (!container) return;

  container.querySelector(".player-score-bar")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "player-score-bar";

  const MAX_SCORE = 5000;

  list.forEach(p => {
    const color = this.uiBuilder.getPlayerColor(p.playerId);

    const score = p.score ?? 0;
    const distance = p.distance ?? 0;
    const total = totals[p.playerId] || 0;

    const percent = Math.min(score / MAX_SCORE, 1) * 100;

    // =========================
    // SCORE BAR
    // =========================
    const bar = document.createElement("div");
    bar.className = "player-score";

    bar.style.position = "relative";
    bar.style.margin = "8px 0 2px 0";
    bar.style.padding = "10px";
    bar.style.borderRadius = "8px";
    bar.style.overflow = "hidden";
    bar.style.background = "rgba(255,255,255,0.08)";

    bar.innerHTML = `
      <div style="
        position: relative;
        z-index: 2;
        display: flex;
        justify-content: space-between;
        font-size: 13px;
        color: white;
      ">
        <span>${p.playerId}</span>
        <span>${distance.toFixed(1)} км</span>
        <span>${score} / ${MAX_SCORE}</span>
      </div>

      <div class="fill"></div>
    `;

    const fill = bar.querySelector(".fill");

    fill.style.position = "absolute";
    fill.style.left = "0";
    fill.style.top = "0";
    fill.style.height = "100%";
    fill.style.width = `${percent}%`;
    fill.style.background = color;
    fill.style.opacity = "0.35";
    fill.style.transition = "width 0.4s ease";

    // =========================
    // TOTAL TEXT (ОТДЕЛЬНО)
    // =========================
    const totalEl = document.createElement("div");

totalEl.style.margin = "2px 0 10px 6px";
totalEl.style.fontSize = "16px";     // 👈 больше
totalEl.style.color = "#ffffff";     // 👈 белый

    totalEl.textContent = `Общий счёт: ${total}`;

    // =========================
    // APPEND
    // =========================
    wrap.appendChild(bar);
    wrap.appendChild(totalEl);
  });

  container.appendChild(wrap);
}

 // =========================
 // TIMER BAR
 // =========================

startRoundDelay(duration, onFinish) {
  this.stopRoundDelay();

  const bar = this.roundRoot?.querySelector(".round-timer-bar");
  if (!bar) return;

  bar.style.transition = "none";
  bar.style.transform = "scaleX(1)";

  const start = performance.now();

  const animate = (now) => {
   const progress = Math.max(0, 1 - (now - start) / duration);

   bar.style.transform = `scaleX(${progress})`;

   if (progress > 0) {
    this.delayFrame = requestAnimationFrame(animate);
   } else {
    this.stopRoundDelay();
    onFinish?.();
   }
  };

  this.delayFrame = requestAnimationFrame(animate);
 }

 stopRoundDelay() {
  if (this.delayFrame) {
   cancelAnimationFrame(this.delayFrame);
   this.delayFrame = null;
  }

  const bar = this.roundRoot?.querySelector(".round-timer-bar");
  if (bar) bar.style.transform = "scaleX(0)";
 }
}
