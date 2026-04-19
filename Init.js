const mapUI = new MapUI({ element });
        const staticUI = new StaticUI({ element });

        console.log("[Init] UI created");

        // =================================================
        // MAP INIT (CRITICAL ZONE)
        // =================================================
        console.log("[Init] initializing maps");

        mapUI.initGuessMap();
        console.log("[Init] guess map OK");

        mapUI.initOverviewMap();
        console.log("[Init] overview map OK");

        mapUI.initStreetView();
        console.log("[Init] street view OK");

        console.log("[Init] maps fully initialized");

        // =================================================
        // BRIDGE
        // =================================================
        console.log("[Init] creating bridge");

        new Bridge({
            game,
            mapUI,
            staticUI
        });

        console.log("[Init] bridge ready");

        // =================================================
        // START GAME
        // =================================================
        console.log("[Init] starting game");

        game.startGame();

        console.log("[Init] =============================");
        console.log("[Init] GAME STARTED SUCCESSFULLY");
        console.log("[Init] =============================");

    } catch (err) {
        console.error("[Init] FAILED:");
        console.error(err);
        console.error(err?.stack);
    }
}

// =====================================================
// RUN
// =====================================================

bootstrap();
