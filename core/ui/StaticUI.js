
export class StaticUI {
    constructor({ element }) {
        this.element = element;

        // =====================================================
        // HUD
        // =====================================================
        this.roundEl = element.querySelector(".round");
        this.scoreEl = element.querySelector(".total-score");
        this.timeEl = element.querySelector(".time-left");
        this.movesEl = element.querySelector(".moves-left");

        // =====================================================
        // SCREENS
        // =====================================================
        this.loadingOverlay = element.querySelector(".loading-screen");
        this.resultScreen = element.querySelector(".guess-overview");

        // =====================================================
        // RESULT UI (GLOBAL SCOPE SAFE)
        // =====================================================
        this.progressBar = document.querySelector(".score-progress");
        this.textEls = document.querySelectorAll(".score-text p");
        this.nextBtn = element.querySelector(".next-round-button");
        this.endButtons = element.querySelector(".game-end-buttons");

        this.form = element.querySelector(".high-score-form");
    }

    // =====================================================
    // GAME VISIBILITY
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
        this.loadingOverlay?.style && (this.loadingOverlay.style.display = "flex");
    }

    hideLoading() {
        this.loadingOverlay?.style && (this.loadingOverlay.style.display = "none");
    }

    // =====================================================
    // HUD
    // =====================================================

    updateHUD({ round, roundCount, score, time, moves }) {
        if (this.roundEl) {
            this.roundEl.innerHTML = `Раунд: <b>${round}/${roundCount}</b>`;
        }

        if (this.scoreEl) {
            this.scoreEl.innerHTML = `Счёт: <b>${score ?? 0}</b>`;
        }

        if (this.timeEl) {
            this.timeEl.innerHTML = `Время: <b>${time ?? 0}</b>`;
        }

        if (this.movesEl) {
            this.movesEl.innerHTML = `Шагов: <b>${moves ?? 0}</b>`;
        }
    }

    // =====================================================
    // ROUND FLOW
    // =====================================================

    showRoundReady() {}

    startRound() {
        this.hideLoading();
        this.hideResult();
    }

    // =====================================================
    // RESULT LOGIC
    // =====================================================

    formatDistance(km) {
        if (typeof km !== "number" || isNaN(km)) return "-";

        if (km < 1) return `${Math.round(km * 1000)} м`;
        if (km < 100) return `${km.toFixed(1)} км`;
        return `${Math.round(km)} км`;
    }

    showRoundResult(data) {
        this.showResult();

        const score = data?.score ?? 0;
        const distance = data?.distance;

        const progress = Math.min((score / 5000) * 100, 100);

        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }

        if (this.textEls?.length >= 2) {
            this.textEls[0].innerText =
                `Вы в ${this.formatDistance(distance)} от места`;

            this.textEls[1].innerText =
                `Счёт: ${score} | Итог: ${data?.totalScore ?? 0}`;
        }

        if (this.nextBtn) {
            this.nextBtn.style.display = "inline-block";
        }

        if (this.endButtons) {
            this.endButtons.style.display = "none";
        }
    }

    showGameResult(data) {
        this.showResult();

        const progress =
            (data?.totalScore ?? 0) /
            ((5000 * (data?.roundCount ?? 1)));

        if (this.progressBar) {
            this.progressBar.style.width = `${Math.min(progress * 100, 100)}%`;
        }

        const last = data?.history?.at?.(-1);

        if (this.textEls?.length >= 2) {
            this.textEls[0].innerText =
                `Последний результат: ${this.formatDistance(last?.result?.distance)}`;

            this.textEls[1].innerText =
                `Итоговый счёт: ${data?.totalScore ?? 0}`;
        }

        if (this.nextBtn) {
            this.nextBtn.style.display = "none";
        }

        if (this.endButtons) {
            this.endButtons.style.display = "block";
        }
    }

    // =====================================================
    // SCREEN CONTROL
    // =====================================================

    showResult() {
        this.resultScreen?.classList.add("active");
    }

    hideResult() {
        this.resultScreen?.classList.remove("active");
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



