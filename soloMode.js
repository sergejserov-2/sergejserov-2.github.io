import { UI } from "./UI.js";

// =========================================================
// SOLO MODE — GAME → UI ROUTER
// =========================================================

export function bindSoloMode(game, ui) {

    // =====================================================
    // LOBBY
    // =====================================================

    game.on("gamePrepared", () => {
        ui.showLobby();
    });

    game.on("gameStarted", () => {
        ui.hideLobby();
        ui.hideOverview();
    });

    // =====================================================
    // LIVE HUD (2В)
    // =====================================================

    game.on("hudUpdated", (data) => {
        ui.updateRoundHUD(data);
    });

    // =====================================================
    // ROUND FLOW
    // =====================================================

    game.on("roundStarted", (data) => {
        ui.updateRoundHUD(data);
    });

    game.on("roundEnded", (data) => {
        ui.showRoundOverview(data);
    });

    // =====================================================
    // GAME END
    // =====================================================

    game.on("gameEnded", (data) => {
        ui.showGameOverview(data);
    });

    // =====================================================
    // GUESS FLOW
    // =====================================================

    game.on("guessFinished", () => {
        ui.disableGuessButton?.();
    });
}
