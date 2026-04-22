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

  this.roundRoot = document.querySelector(".round-result");
  this.gameRoot = document.querySelector(".game-result");
 }

 // =========================
 // HUD
 // =========================

 updateHUD(vm = {}) {
  if (this.roundEl) {
   this.roundEl.textContent =
    `Раунд: ${vm.round} / ${vm.roundLimit}`;
  }

  if (this.totalEl) {
   this.totalEl.textContent =
    `Общий счёт: ${vm.totalScore}`;
  }

  const timeWrap = this.timeEl?.parentElement;
  if (timeWrap) {
   timeWrap.style.display = vm.showTime ? "block" : "none";
  }

  const movesWrap = this.movesEl?.parentElement;
  if (movesWrap) {
   movesWrap.style.display = vm.showMoves ? "block" : "none";
  }
 }

 updateTimer(value) {
  if (!this.timeEl) return;
  this.timeEl.textContent = `Время: ${value}`;
 }

 updateMoves(value) {
  if (!this.movesEl) return;
  this.movesEl.textContent =
   value === -1 ? "∞" : `Ходы: ${value}`;
 }

 // =========================
 // HELPERS
 // =========================

 renderPlayers(root, players = [], getColor) {
  if (!root) return;

  const container = root.querySelector(".players-score");
  if (!container) return;

  container.innerHTML = "";

  players.forEach(p => {
   const color = getColor?.(p.playerId) || "#fff";

   const el = document.createElement("div");
   el.className = "player-score";

   el.innerHTML = `
    <div class="player-row">
      <span class="player-id" style="color:${color}">
        ${p.playerId}
      </span>

      <span class="player-distance">
        ${p.distance?.toFixed(1) ?? 0} км
      </span>

      <span class="player-score-value">
        ${p.score ?? 0}
      </span>
    </div>

    <div class="score-progress-bar">
      <div class="score-progress" 
           style="width:${Math.min(Math.max(p.progress ?? 0,0),1)*100}%;
                  background:${color}">
      </div>
    </div>
   `;

   container.appendChild(el);
  });
 }

 // =========================
 // ROUND RESULT
 // =========================

 showRoundResult(model = {}) {
  const root = this.roundRoot;
  if (!root) return;

  const text = root.querySelector(".score-text");
  const players = model.players || [];

  // =========================
  // TEXT (fallback SOLO)
  // =========================
  if (text) {
   if (players.length > 1) {
    text.innerHTML = `<p><b>Результаты раунда</b></p>`;
   } else {
    const p = players[0];
    text.innerHTML = `
     <p>Расстояние: ${p?.distance?.toFixed(1) ?? 0} км</p>
     <p>Очки: ${p?.score ?? 0}</p>
    `;
   }
  }

  // =========================
  // PLAYERS UI
  // =========================
  this.renderPlayers(
   root,
   players,
   model.getPlayerColor
  );
 }

 // =========================
 // GAME RESULT
 // =========================

 showGameResult(model = {}) {
  const root = this.gameRoot;
  if (!root) return;

  const text = root.querySelector(".score-text");
  const players = model.players || [];

  if (text) {
   text.innerHTML = `
    <p><b>Итог игры</b></p>
   `;
  }

  this.renderPlayers(
   root,
   players,
   model.getPlayerColor
  );

  this.stopRoundDelay();
 }

 // =========================
 // ROUND DELAY BAR
 // =========================

 startRoundDelay(duration, onFinish) {
  this.stopRoundDelay();

  if (!this.delayBar) return;

  this.delayBar.style.transition = "none";
  this.delayBar.style.transform = "scaleX(1)";

  const start = performance.now();

  const animate = (now) => {
   const elapsed = now - start;
   const progress = Math.max(0, 1 - elapsed / duration);

   this.delayBar.style.transform = `scaleX(${progress})`;

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

  if (this.delayBar) {
   this.delayBar.style.transform = "scaleX(0)";
  }
 }
}
