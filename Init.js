async function bootstrap() {
    try {
        await waitForGoogle();

        tweaks();

        const config = loadConfig();
        const area = AreaRegistry[config.area];

        const element = document.querySelector(".game");

        // =========================
        // CORE
        // =========================
        const geometry = new Geometry();
        const mapAdapter = new MapAdapter(window.google);

        const generator = new LocationGenerator({
            mapAdapter,
            geometry
        });

        const scoring = new Scoring(geometry);

        // =========================
        // GAME
        // =========================
        const game = new Game({
            area,
            element,
            rules: config.rules,
            generator,
            scoring,
            mapAdapter
        });

        // =========================
        // UI
        // =========================
        const mapUI = new MapUI({ element });
        const staticUI = new StaticUI({ element });

        // =========================
        // INIT MAPS (ONLY STRUCTURE)
        // =========================
        mapUI.initGuessMap();
        mapUI.initOverviewMap();
        mapUI.initStreetView();

        // =========================
        // BRIDGE
        // =========================
        new Bridge({
            game,
            mapUI,
            staticUI
        });

        // =========================
        // START
        // =========================
        game.startGame();

    } catch (err) {
        console.error("[Init] FAILED:", err);
    }
}
