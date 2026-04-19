console.log("[Init] file loaded");

// =====================================================
// GOOGLE WAIT
// =====================================================

async function waitForGoogle() {
    console.log("[Init] waiting for Google Maps...");

    let tries = 0;

    while (!window.google?.maps) {
        await new Promise(r => setTimeout(r, 50));

        tries++;

        if (tries % 20 === 0) {
            console.log("[Init] still waiting for Google Maps...");
        }

        if (tries > 400) {
            throw new Error("Google Maps failed to load (timeout)");
        }
    }

    console.log("[Init] Google Maps ready");
}

// =====================================================
// CONFIG
// =====================================================

function loadConfig() {
    console.log("[Init] loading config from localStorage");

    const raw = localStorage.getItem("gameConfig");

    if (!raw) {
        throw new Error("No gameConfig found in localStorage");
    }

    try {
        const parsed = JSON.parse(raw);
        console.log("[Init] config parsed:", parsed);
        return parsed;
    } catch (e) {
        throw new Error("Invalid gameConfig JSON");
    }
}

// =====================================================
// BOOTSTRAP
// =====================================================

async function bootstrap() {
    try {
        console.log("[Init] =============================");
        console.log("[Init] BOOTSTRAP START");
        console.log("[Init] =============================");

        // =================================================
        // GOOGLE
        // =================================================
        await waitForGoogle();

        // =================================================
        // TWEAKS
        // =================================================
        console.log("[Init] applying tweaks");

        tweaks();

        console.log("[Init] tweaks OK");

        // =================================================
        // CONFIG
        // =================================================
        const config = loadConfig();

        console.log("[Init] config loaded");

        // =================================================
        // AREA
        // =================================================
        console.log("[Init] resolving area:", config.area);

        const area = AreaRegistry[config.area];

        if (!area) {
            console.error("[Init] AVAILABLE AREAS:", AreaRegistry);
            throw new Error(Unknown area: ${config.area});
        }

        console.log("[Init] area resolved");

        // =================================================
        // DOM ROOT
        // =================================================
        const element = document.querySelector(".game");

        if (!element) {
            throw new Error("Root .game element not found");
        }

        console.log("[Init] DOM ready");

        // =================================================
        // CORE
        // =================================================
        console.log("[Init] creating core");

        const geometry = new Geometry();
        const mapAdapter = new MapAdapter(window.google);

        const generator = new LocationGenerator({
            mapAdapter,
            geometry
        });

        const scoring = new Scoring(geometry);

        console.log("[Init] core ready");

        // =================================================
        // GAME
        // =================================================
        console.log("[Init] creating game");

        const game = new Game({
            area,
            element,
            rules: config.rules,
            generator,
            scoring,
            mapAdapter
        });

        console.log("[Init] game created");

        // =================================================
        // UI
        // =================================================
        console.log("[Init] creating UI");
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
