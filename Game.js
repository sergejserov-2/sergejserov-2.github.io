import { Scores } from "./Scores.js";
import { Streetview } from "./Streetview.js";
import { Emitter } from "./Emitter.js";

export const distribution = { weighted: 0, uniform: 1 };

// =========================================================
// FSM
// =========================================================

class FSM {
    constructor(initial = "prepared") {
        this.state = initial;

        this.allowed = {
            prepared: ["started"],
            started: ["ended"],
            ended: ["prepared"]
        };
    }

    get() {
        return this.state;
    }

    is(v) {
        return this.state === v;
    }

    transition(next) {
        const allowedNext = this.allowed[this.state] || [];

        if (!allowedNext.includes(next)) {
            console.warn(`[FSM] Invalid transition: ${this.state} → ${next}`);
            return false;
        }

        this.state = next;
        return true;
    }
}

// =========================================================
// GAME ENGINE
// =========================================================

export class Game extends Emitter {
    constructor(map, rules = {
        roundCount: 5,
        moveLimit: -1,
        panAllowed: true,
        timeLimit: -1,
        zoomAllowed: true
    }) {
        super();

        this.map = map;
        this.rules = rules;

        // ---------- STATE ----------
        this.state = {
            game: new FSM(),
            round: new FSM(),
            players: {
                p1: { fsm: new FSM() }
            }
        };

        // ---------- CORE DATA ----------
        this.currentRound = 0;
        this.history = [];
        this.currentDestination = null;
        this.nextDestination = null;

        this.score = 0;

        this.scores = new Scores();

        // ---------- STREETVIEW ENGINE ----------
        this.streetview = new Streetview({
            map: this.map,
            distribution: distribution.weighted
        });

        // ---------- INTERNAL ----------
        this.roundReady = false;
        this.mapLoading = false;
        this.mapLoaded = false;

        this.timer = null;
        this.time = 0;
        this.moves = 0;

        this.zoom = this.map?.minimumDistanceForPoints < 3000 ? 18 : 14;

        this.preloadNext();
    }

    // =====================================================
    // GAME FLOW
    // =====================================================

    startGame() {
        if (!this.state.game.transition("started")) return;

        this.currentRound = 1;

        this.fire("gameStarted", this.getHUDState());

        this.startRound();
    }

    prepareRound() {
        this.state.round = new FSM("prepared");

        this.mapLoading = false;
        this.mapLoaded = false;
        this.roundReady = false;

        this.marker = null;

        this.preloadNext();

        this.fire("roundPrepared");
    }

    startRound() {
        if (!this.roundReady || !this.nextDestination) {
            this.once("preload", () => this.startRound());
            return;
        }

        if (!this.state.round.transition("started")) return;

        this.currentDestination = this.nextDestination;

        this.time = 0;
        this.moves = 0;

        this.fire("roundStarted", {
            round: this.currentRound,
            roundCount: this.rules.roundCount,
            location: this.currentDestination
        });

        this.startTimer();
    }

    endRound(payload = {}) {
        if (!this.state.round.transition("ended")) return;

        this.stopTimer();

        this.score += payload.score || 0;

        this.history.push(payload);

        this.fire("roundEnded", {
            ...payload,
            totalScore: this.score,
            round: this.currentRound
        });

        const isLast = this.currentRound >= this.rules.roundCount;
    setTimeout(() => {
            if (isLast) {
                this.endGame();
            } else {
                this.currentRound++;
                this.prepareRound();
                this.startRound();
            }
        }, 3000);
    }

    // =====================================================
    // GUESS FLOW
    // =====================================================

    finishGuess(playerId = "p1") {
        const player = this.state.players[playerId];
        if (!player || !player.fsm.is("started")) return;

        player.fsm.transition("ended");

        const payload = {
            playerId,
            guess: null,
            actual: this.currentDestination,
            round: this.currentRound
        };

        this.fire("guessFinished", payload);

        this.checkRoundEnd(payload);
    }

    checkRoundEnd(payload) {
        const allEnded = Object.values(this.state.players)
            .every(p => p.fsm.is("ended"));

        if (!allEnded) return;

        this.endRound(payload);
    }

    // =====================================================
    // TIMER (LOGIC ONLY)
    // =====================================================

    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.fire("hudUpdated", this.getHUD());
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timer);
        this.timer = null;
    }

    // =====================================================
    // PRELOAD
    // =====================================================

    preloadNext() {
        if (this.mapLoading) return;

        this.mapLoading = true;

        this.streetview.randomValidLocation(this.zoom)
            .then(next => {
                this.nextDestination = next;

                this.mapLoaded = true;
                this.mapLoading = false;
                this.roundReady = true;

                this.fire("preload");
            })
            .catch(() => {
                this.mapLoading = false;
                this.mapLoaded = false;
                this.roundReady = false;
            });
    }

    // =====================================================
    // ENGINE HELPERS
    // =====================================================

    getHUDState() {
        return {
            round: this.currentRound,
            roundCount: this.rules.roundCount,
            score: this.score,
            time: this.time,
            moves: this.moves
        };
    }

    measureDistance(from, to) {
        return google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(...from),
            new google.maps.LatLng(...to)
        );
    }

    formatDistance(meters) {
        if (meters < 1000) return `${Math.floor(meters)} м`;
        if (meters < 20000) return `${Math.floor(meters / 100) / 10} км`;
        return `${Math.floor(meters / 1000)} км`;
    }

    // =====================================================
    // END GAME
    // =====================================================

    endGame() {
        if (!this.state.game.transition("ended")) return;

        this.fire("gameEnded", {
            totalScore: this.score,
            roundCount: this.rules.roundCount,
            history: this.history
        });
    }
}
