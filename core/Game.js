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
        this.gameState = "idle";      // idle | active | ended
        this.roundState = "loading";  // loading | ready | active | ended

        this.currentRound = 0;
        this.maxRounds = rules.roundCount;

        this.current = null; // actual location
        this.next = null;

        this.generating = false;

        // PLAYERS (NO GUESS HERE ANYMORE)
        this.players = {
            p1: { state: "idle", score: 0 }
        };

        // CORE GAME STATE
        this.currentGuess = null;

        // DATA
        this.history = [];
        this.score = 0;

        // TIMER
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
        this.fire("hudUpdated", this.getHUDState());

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

        this.currentGuess = null; // 💥 RESET GUESS PER ROUND

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

        this.fire("hudUpdated", this.getHUDState());

        this.startTimer();
    }

    // =====================================================
    // GUESS API (NEW CLEAN STATE)
    // =====================================================

    setGuess(playerId = "p1", point) {
        if (playerId !== "p1") return;

        this.currentGuess = point;

        this.fire("guessUpdated", {
            playerId,
            point
        });
    }

    getCurrentGuess() {
        return this.currentGuess;
    }

    // =====================================================
    // FINISH GUESS
    // =====================================================

    finishGuess(playerId = "p1") {
        const player = this.players[playerId];

        if (!player || player.state !== "playing") return;

        player.state = "finished";

        const result = this.scoring.calculateResult({
            guess: this.currentGuess,
            actual: this.current
        });

        this.score += result.score;
        this.fire("guessFinished", {
            playerId,
            actual: this.current,
            round: this.currentRound,
            result
        });

        this.endRound({ result });
    }

    // =====================================================
    // ROUND END
    // =====================================================

    endRound(payload = {}) {
        this.stopTimer();

        Object.values(this.players).forEach(p => {
            p.state = "idle";
        });

        this.roundState = "ended";

        this.history.push(payload);

        this.fire("roundEnded", {
            ...payload,
            totalScore: this.score,
            round: this.currentRound
        });

        const isLast = this.currentRound >= this.maxRounds;

        setTimeout(() => {
            if (isLast) {
                this.endGame();
                return;
            }

            this.currentRound++;
            this.current = null;

            this.prepareNextRound();

        }, 1200);
    }

    // =====================================================
    // TIMER
    // =====================================================

    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.fire("hudUpdated", this.getHUDState());
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timer);
        this.timer = null;
    }

    // =====================================================
    // HUD
    // =====================================================

    getHUDState() {
        return {
            round: this.currentRound,
            roundCount: this.maxRounds,
            score: this.score,
            time: this.time,
            moves: this.moves
        };
    }

    // =====================================================
    // END GAME
    // =====================================================

    endGame() {
        if (this.gameState === "ended") return;

        this.gameState = "ended";

        this.fire("gameEnded", {
            totalScore: this.score,
            roundCount: this.maxRounds,
            history: this.history
        });
    }
}
