export class Orchestrator {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;

        this.bind();
    }

    // =========================================================
    // ORCHESTRATION LAYER (Game → UI)
    // =========================================================

    bind() {

        // -----------------------------------------------------
        // LIVE HUD (continuous updates)
        // -----------------------------------------------------

        this.game.on("hudUpdated", (data) => {
            this.ui.updateRoundHUD(data);
        });

        this.game.on("roundStarted", (data) => {
            this.ui.updateRoundHUD(data);
        });

        // -----------------------------------------------------
        // ROUND FLOW
        // -----------------------------------------------------

        this.game.on("roundEnded", (data) => {
            this.ui.showRoundOverview(data);
        });

        this.game.on("gameEnded", (data) => {
            this.ui.showGameOverview(data);
        });

        // -----------------------------------------------------
        // PRELOAD / UX STATE HOOKS
        // -----------------------------------------------------

        this.game.on("preload", () => {
            this.ui.disableGuessButton?.();
        });

        this.game.on("roundPrepared", () => {
            this.ui.clearGuessMarker?.();
            this.ui.removeOverviewLines?.();
        });

        // -----------------------------------------------------
        // RETURN HOME BRIDGE (UI button → Game → UI)
        // -----------------------------------------------------

        this.game.on("returnHomeRequested", () => {
            if (!this.game.currentDestination) return;

            this.ui.svElement.setLocation(
                ...this.game.currentDestination
            );
        });

        // -----------------------------------------------------
        // OPTIONAL: GAME START SYNC (if needed later)
        // -----------------------------------------------------

        this.game.on("gameStarted", (data) => {
            this.ui.updateRoundHUD(data);
        });
    }
}
