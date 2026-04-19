import { Emitter } from "./Emitter.js";

// GAME (PURE ORCHESTRATOR / DI VERSION)

export class Game extends Emitter {
    constructor({ area, element, rules, generator, scoring }) {
        super();
        console.log("[Game] init");

        // DEPENDENCIES
        this.area = area;
        this.element = element;
        this.rules = rules;
        this.generator = generator;
        this.scoring = scoring;

        // STATE
        this.gameState = "idle"; // idle | active | ended
        this.roundState = "loading"; // loading | ready | active | ended

        this.currentRound = 0;
        this.maxRounds = rules.roundCount;

        this.current = null;
        this.next = null;
        this.generating = false;

        // PLAYERS
        this.players = {
            p1: { state: "idle", score: 0, lastGuess: null }
        };

        // GAME DATA
        this.history = [];
        this.score = 0;

        this.timer = null;
        this.time = 0;
        this.moves = 0;
    }

    // =====================================================
    // START GAME
    // =====================================================

    startGame() {
        if (this.gameState !== "idle") return;

        this.gameState = "active";
        this.currentRound = 1;

        this.fire("gameStarted");
        this.fire("hudUpdated", this.getHUDState()); // ✔ FIX: initial sync

        this.prepareNextRound();
    }

    // =====================================================
    // ROUND PIPELINE
    // =====================================================

    prepareNextRound() {
        if (this.generating) return;

        this.generating = true;
        this.roundState = "loading";

        this.fire("roundLoading");

        this.generator.generate(this.area)
            .then(loc => {
                this.next = loc;
                this.generating = false;

                this.roundState = "ready";

                this.fire("roundReady", {
                    round: this.currentRound,
                    location: loc
                });

                this.startRound();
            })
            .catch(err => {
                console.error("[Game] generation failed", err);
                this.generating = false;
            });
    }

    // =====================================================
    // ROUND START
    // =====================================================

    startRound() {
        if (this.roundState !== "ready" || !this.next) return;

        this.roundState = "active";

        this.current = this.next;
        this.next = null;

        Object.values(this.players).forEach(p => {
            p.state = "playing";
        });

        this.time = 0;
        this.moves = 0;

        this.fire("roundStarted", {
            round: this.currentRound,
            roundCount: this.maxRounds,
            location: this.current
        });

        this.fire("hudUpdated", this.getHUDState()); // ✔ FIX: sync HUD per round

        this.startTimer();

        // ❌ FIX: убрали prepareNextRound отсюда
        // (иначе ломается lifecycle)
    }

    // =====================================================
    // PLAYER ACTION
    // =====================================================

    finishGuess(playerId = "p1") {
        const player = this.players[playerId];

        if (!player || player.state !== "playing") return;

        player.state = "finished";

        const result = this.scoring.calculateResult({
            guess: player.lastGuess,
            actual: this.current
        });

        this.score += result.score;

        this.fire("guessFinished", {
            playerId,
            actual: this.current,
            round
