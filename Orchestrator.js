//upd
export class Orchestrator {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;

        this.bind();
    }

    bind() {

        // =====================
        // GAME START
        // =====================
        this.game.on("gameStarted", (d) => {
            this.ui.hideLobby?.();
            this.ui.updateRoundHUD?.(d);
        });

        // =====================
        // ROUND PREPARED
        // =====================
        this.game.on("roundPrepared", () => {
            this.ui.clearGuessMarker?.();
            this.ui.removeOverviewLines?.();
            this.ui.showLoading?.();
        });

        // =====================
        // ROUND STARTED (основной игровой момент)
        // =====================
        this.game.on("roundStarted", (d) => {
            this.ui.hideLoading?.();

            this.ui.clearGuessMarker?.();
            this.ui.removeOverviewLines?.();

            this.ui.enableGuessButton?.();

            // StreetView загрузка
            if (this.ui.svElement && d?.location) {
                this.ui.svElement.setLocation(
                    d.location.lat,
                    d.location.lng
                );
            }

            this.ui.resetMap?.();
        });

        // =====================
        // ROUND ENDED
        // =====================
        this.game.on("roundEnded", (d) => {
            this.ui.showRoundOverview?.(d);
            this.ui.disableGuessButton?.();
        });

        // =====================
        // GAME ENDED
        // =====================
        this.game.on("gameEnded", (d) => {
            this.ui.showGameOverview?.(d);
        });

        // =====================
        // RETURN HOME (если используется)
        // =====================
        this.game.on("returnHomeRequested", ({ location }) => {
            if (!location) return;

            this.ui.svElement?.setLocation(
                location.lat,
                location.lng
            );
        });
    }
}
