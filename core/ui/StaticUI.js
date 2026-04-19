export class StaticUI {
    constructor({ element }) {
        this.element = element;

        // HUD
        this.roundEl = element.querySelector(".round");
        this.scoreEl = element.querySelector(".total-score");
        this.timeEl = element.querySelector(".time-left");
        this.movesEl = element.querySelector(".moves-left");

        // SCREENS
        this.loadingOverlay = element.querySelector(".loading-screen");
        this.resultScreen = element.querySelector(".guess-overview");

        // RESULT UI
        this.progressBar = element.querySelector(".score-progress");
        this.textEls = element.querySelectorAll(".score-text p");
        this.nextBtn = element.querySelector(".next-round-button");
        this.endButtons = element.querySelector(".game-end-buttons");

        this.form = element.querySelector(".high-score-form");
    }

    // =====================================================
    // GAME STATES
    // =====================================================

    showGame() {
        this.element.classList.remove("hidden");
    }

    hideGame() {
        this.element.classList.add("hidden");
    }

    // =====================================================
    // LOADING
    // =====================================================

    showLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = "flex";
        }
    }

    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.style.display = "none";
        }
    }

    // =====================================================
    // HUD
    // =====================================================

    updateHUD({ round, roundCount, score, time, moves }) {
        if (this.roundEl) {
            this.roundEl.innerHTML = `Раунд: <b>${round}/${roundCount}</b>`;
        }

        if (this.scoreEl) {
            this.scoreEl.innerHTML = `Счёт: <b>${score}</b>`;
        }

        if (this.timeEl) {
            this.timeEl.innerHTML = `Время: <b>${time}</b>`;
        }

        if (this.movesEl) {
            this.movesEl.innerHTML = `Шагов: <b>${moves}</b>`;
        }
    }

    // =====================================================
    // ROUND READY
    // =====================================================

    showRoundReady(round) {
        // optional animation
    }

    // =====================================================
    // ROUND START
    // =====================================================

    startRound() {
        this.hideLoading();
        this.hideResult();
    }

    // =====================================================
    // RESULT SCREEN (ROUND END)
    // =====================================================

    showRoundResult(data) {
        this.showResult();
        const progress = (data.score / 5000) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}`%;
        }
        if (this.textEls?.length >= 2) {
            this.textEls[0].innerText =
                `Вы в ${data.distance} от места`;
            this.textEls[1].innerText =
                `Счёт: ${data.score} | Итог: ${data.totalScore}`;
        }
        this.nextBtn.style.display = "inline-block";
        this.endButtons.style.display = "none";
    }

    // =====================================================
    // GAME END SCREEN
    // =====================================================

showGameResult(data) {
    this.showResult();
    const progress =
        (data.totalScore / (5000 * data.roundCount)) * 100;
    if (this.progressBar) {
        this.progressBar.style.width = `${progress}%`;
    }
    const last = data.history?.at(-1);
    if (this.textEls?.length >= 2) {
        this.textEls[0].innerText =
            `Последний результат: ${last?.result?.distance || "-"`};
        this.textEls[1].innerText =
            `Итоговый счёт: ${data.totalScore}`;
    }
    this.nextBtn.style.display = "none";
    this.endButtons.style.display = "block";
}

    // =====================================================
    // SCREEN CONTROL
    // =====================================================

    showResult() {
        if (this.resultScreen) {
            this.resultScreen.classList.add("active");
        }
    }

    hideResult() {
        if (this.resultScreen) {
            this.resultScreen.classList.remove("active");
        }
    }

    // =====================================================
    // FORM
    // =====================================================

    bindScoreSubmit(handler) {
        if (!this.form) return;

        this.form.addEventListener("submit", (e) => {
            e.preventDefault();

            const input = this.form.querySelector(".username-input");

            handler?.(input?.value);
        });
    }
}
