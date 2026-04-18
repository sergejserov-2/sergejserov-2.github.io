import { Scores } from "./Scores.js";
import { LocationGenerator } from "./LocationGenerator.js";
import { Emitter } from "./Emitter.js";

// =========================================================
// GAME (FIXED V1 + RESTORED UTILS)
// =========================================================

export class Game extends Emitter {
    constructor(playArea, element, rules, mapAdapter) {
        super();

        console.log("[Game] init");

        this.playArea = playArea;
        this.element = element;
        this.rules = rules;

        this.generator = new LocationGenerator(mapAdapter, playArea);

        // =====================
        // GAME STATE
        // =====================
        this.gameState = "idle"; // idle | active | ended

        // =====================
        // ROUND STATE
        // =====================
        this.roundState = "loading"; // loading | ready | active | ended

        this.currentRound = 0;
        this.maxRounds = rules.roundCount;

        // buffer
        this.current = null;
        this.next = null;

        this.generating = false;

        // =====================
        // PLAYERS
        // =====================
        this.players = {
            p1: { state: "idle", score: 0 }
        };

        // =====================
        // CORE DATA
        // =====================
        this.history = [];
        this.score = 0;

        this.timer = null;
        this.time = 0;
        this.moves = 0;
    }

    // =====================================================
    // GAME START
    // =====================================================

    startGame() {
        if (this.gameState !== "idle") return;

        this.gameState = "active";
        this.currentRound = 1;

        console.log("[Game] startGame");

        this.fire("gameStarted");

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

        this.generator.getRandomLocation()
            .then(loc => {

                this.next = loc;
                this.generating = false;

                this.roundState = "ready";

                this.fire("roundReady", {
                    round: this.currentRound,
                    location: loc
                });

                // FIXED FLOW: guaranteed start
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

        console.log("[Game] roundStarted", this.current);

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

        this.startTimer();

        this.prepareNextRound();
    }

    // =====================================================
    // PLAYER ACTIONS
    // =====================================================

    finishGuess(playerId = "p1") {
        const player = this.players[playerId];

        if (!player || player.state !== "playing") return;

        player.state = "finished";

        // 🔥 RESTORED: scoring pipeline
        const result = this.calculateResult({
            guess: player.lastGuess,
            actual: this.current,
            time: this.time
        });
        this.score += result.score;

        this.fire("guessFinished", {
            playerId,
            actual: this.current,
            round: this.currentRound,
            result
        });

        this.checkRoundEnd();
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

        }, 1500);
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
    // RESTORED MATH (WILL MOVE TO Math.js LATER)
    // =====================================================

    distance(from, to) {
        return google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(from.lat, from.lng),
            new google.maps.LatLng(to.lat, to.lng)
        );
    }

    formatDistance(meters) {
        if (meters < 1000) return `${Math.floor(meters)} м`;
        if (meters < 20000) return `${Math.floor(meters / 100) / 10} км`;
        return `${Math.floor(meters / 1000)} км`;
    }

    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    calculateResult({ guess, actual, time }) {
        if (!guess || !actual) {
            return { score: 0, distance: 0 };
        }

        const distance = this.distance(guess, actual);
        const score = this.calculateScore(distance);

        return {
            distance,
            formatted: this.formatDistance(distance),
            score
        };
    }

    // =====================================================
    // END GAME
    // =====================================================

    endGame() {
        if (this.gameState === "ended") return;

        this.gameState = "ended";

        console.log("[Game] gameEnded");

        this.fire("gameEnded", {
            totalScore: this.score,
            roundCount: this.maxRounds,
            history: this.history
        });
    }
}
