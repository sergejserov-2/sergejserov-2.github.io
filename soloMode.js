export function soloMode(game, ui) {

    // =========================================================
    // INIT
    // =========================================================

    game.on("gamePrepared", () => {
        ui.showLobby();
    });

    game.on("gameStarted", () => {
        ui.hideLobby();

        ui.initMapUI({
            polygon: game.map?.polygon,
            isEmbedMode: true
        });
    });

    // =========================================================
    // ROUND START
    // =========================================================

    game.on("roundStarted", (data) => {
        const { round, roundCount, timeLimit } = data;

        ui.showRoundUI({ round, roundCount });

        ui.clearGuessMarker();
        ui.disableGuessButton();

        ui.startTimer(timeLimit);
    });

    // =========================================================
    // GUESS FLOW
    // =========================================================

    // пользователь нажал guess → game считает результат
    ui.element
        .querySelector(".guess-button")
        .addEventListener("click", () => {
            if (!ui.marker) return;

            const pos = ui.marker.getPosition();

            game.makeGuess([pos.lat(), pos.lng()]);
        });

    // когда гесс принят
    game.on("guessFinished", () => {
        ui.endTimer();
        ui.disableGuessButton();
    });

    // =========================================================
    // ROUND END (OVERVIEW)
    // =========================================================

    game.on("roundEnded", (data) => {
        ui.showRoundOverview(data);
    });

    // кнопка следующий раунд
    ui.element
        .querySelector(".next-round-button")
        .addEventListener("click", () => {
            ui.hideOverview();
            ui.removeOverviewLines();

            game.startNextRound();
        });

    // =========================================================
    // GAME END
    // =========================================================

    game.on("gameEnded", (data) => {
        ui.showGameOverview(data);
    });

    // =========================================================
    // EXTRA (если нужен overlay toggle)
    // =========================================================

    ui.element
        .querySelector(".toggle-map-overlay")
        ?.addEventListener("click", () => {
            ui.toggleMapOverlay();
        });
}
