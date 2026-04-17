export class Orchestrator {
    constructor(game, ui) {
        this.game = game;
        this.ui = ui;

        this.bind();
    }

    bind() {

        // =====================
        // HUD 
        // =====================
        this.game.on("hudUpdated", d => {
            this.ui.updateRoundHUD(d);
        });

        // =====================
        // ROUND START 
        // =====================
        this.game.on("roundStarted", d => {
            // можно использовать как reset UI state если надо
            this.ui.clearGuessMarker?.();
            this.ui.removeOverviewLines?.();
        });

        // =====================
        // ROUND END SCREEN
        // =====================
        this.game.on("roundEnded", d => {
            this.ui.showRoundOverview(d);
        });

        // =====================
        // GAME END SCREEN
        // =====================
        this.game.on("gameEnded", d => {
            this.ui.showGameOverview(d);
        });

        // =====================
        // PRELOAD UX
        // =====================
        this.game.on("preload", () => {
            this.ui.disableGuessButton?.();
        });

        // =====================
        // RETURN HOME 
        // =====================
        this.game.on("returnHomeRequested", ({ location }) => {
            if (!location) return;
            this.ui.svElement.setLocation(...location);
        });
    }
}
