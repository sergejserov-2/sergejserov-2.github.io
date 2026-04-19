
import { Emitter } from "./Emitter.js";

export class Game extends Emitter {
    constructor({ area, element, rules, generator, scoring }) {
        super();

        console.log("[Game] init");

        this.area = area;
        this.element = element;
        this.rules = rules;
        this.generator = generator;
        this.scoring = scoring;

        // STATE
        this.gameState = "idle";
        this.roundState = "loading";

        this.currentRound = 0;
        this.maxRounds = rules.roundCount;

        this.current = null;
        this.next = null;

        this.generating = false;

        this.players = {
            p1: { state: "idle" }
        };

        this.currentGuess = null;
        this.isLocked = false;

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

        this.currentGuess = null;
        this.isLocked = false;

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
    // GUESS API
    // =====================================================

    setGuess(playerId = "p1", point) {
        if (this.isLocked) return;

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
        if (this.isLocked) return;

        this.isLocked = true;
        player.state = "finished";

        const result = this.scoring.calculateResult({
            guess: this.currentGuess,
            actual: this.current
        });

        this.score += result.score;

        this.fire("guessFinished", {
            playerId,
            result,
            guess: this.currentGuess,
            actual: this.current
        });

        this.endRound({result});
    }

    // =====================================================
    // ROUND END
    // =====================================================

    endRound({ result } = {}) {
        this.stopTimer();
        this.roundState = "ended";
        this.history.push({ result });
    
        const score = result?.score ?? 0;
        const distance = result?.distance ?? null;
    
        this.fire("roundEnded", {
            score,
            distance,
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

        const isLast = this.currentRound >= this.maxRounds;

        setTimeout(() => {
            if (isLast) {
                this.endGame();
                return;
            }

            this.currentRound++;
            this.current = null;

            this.prepareNextRound();

        }, 3000);
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
