import { Scores } from "./Scores.js";
import { Streetview } from "./Streetview.js";
import { Emitter } from "./Emitter.js";

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
    constructor(map, element, rules) {
        super();
        this.map = map;
        this.element = element;
        this.rules = rules;
        this.streetview = new Streetview(map);
        

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
        this.score = 0;
        this.scores = new Scores();

        this.currentDestination = null;
        this.nextDestination = null;
        this.nextDestinationPromise = null;

        this.timer = null;
        this.time = 0;
        this.moves = 0;

        this.zoom = this.map?.minimumDistanceForPoints < 3000 ? 18 : 14;
    }

    // =====================================================
    // GAME FLOW
    // =====================================================

    startGame() {
        if (!this.state.game.transition("started")) return;
            this.currentRound = 1;
            this.fire("gameStarted", this.getHUDState());
            this.prepareRound();
    }
   
    prepareRound() {
        console.log("[Game] prepareRound");
        this.state.round.transition("prepared");
        this.currentDestination = null;
        this.nextDestination = null;
        this.marker = null;
        this.nextDestinationPromise = this.streetview.getRandomLocation(
            this.rules.zoom ?? 14
        );
        this.nextDestinationPromise
            .then(location => {
                console.log("[Game] destination ready", location);
                this.nextDestination = location;
            })
            .catch(err => {
                console.error("[Game] prepareRound failed", err);
            });
        this.fire("roundPrepared");
        // auto-flow
        this.startRound();
    }
    
    startRound() {
        if (!this.state.round.transition("started")) return;
        console.log("[Game] startRound");
        const proceed = () => {
            this.currentDestination = this.nextDestination;
            this.nextDestination = null;
            this.time = 0;
            this.moves = 0;
            this.fire("roundStarted", {
                round: this.currentRound,
                roundCount: this.rules.roundCount,
                location: this.currentDestination
            });
            this.startTimer();
        };
    
        // защита от преждевременного старта
        if (!this.nextDestination) {
            console.log("[Game] waiting for destination...");
            this.nextDestinationPromise.then(() => {
                proceed();
            });
            return;
        }
        proceed();
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
