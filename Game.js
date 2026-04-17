// Здесь общая логика игры. 

import { Scores } from "./Scores.js";
import { Streetview } from "./Streetview.js";
import { Emitter } from "./Emitter.js";

export const distribution = { weighted: 0, uniform: 1 }; 

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
            console.warn(
                `[FSM] Invalid transition: ${this.state} → ${next}`
            );
            return false;
        }

        const prev = this.state;
        this.state = next;

        return true;
    }
}

export class Game extends Emitter {
    constructor(map, element, rules = {
        roundCount: 5,
        moveLimit: -1,
        panAllowed: true,
        timeLimit: -1,
        zoomAllowed: true
    }) {
        super();
        if (localStorage.user !== undefined) element.querySelector(".username-input").value = localStorage.user;
        if (map.name === "my_area") element.querySelector(".high-score-form").style.display = "none";

        this.ezMode = false;
        this.distribution = distribution.weighted;

this.streetview = new Streetview({
    map: this.map,
    distribution: this.distribution
});

        this.scores = new Scores();
        

        });
        this.setResizeEventListeners();
        this.currentRound = 0;
        this.map = map;
        this.rules = null;
        this.events = {};
        this.currentRound = 0;
        this.nextDestination = null;
        this.currentDestination = null;
        this.roundReady = false;
        this.roundStarting = false;

            
        this.state = {
            game: new FSM(),
            round: new FSM(),
            players: {
                p1: new FSM()
            }
        };
    }
    
                                                         async uploadScore(e) {
                                                            if (e) e.preventDefault();
                                                    
                                                            console.log(this);
                                                    
                                                            let username = this.element.querySelector(".username-input").value;
                                                            if (this.latestScore) {
                                                                this.latestScore.user = username;
                                                                console.log("settings locastorage user to ", username);
                                                                localStorage.user = username;
                                                                this.scores.addLocal(this.latestScore);
                                                                await this.scores.addGlobal(this.latestScore);
                                                            }
                                                    
                                                            // console.log("redirect now");
                                                            location.href = "../highscore/#" + this.map.name;
                                                        }

                                                            async logHighScores() {
                                                                let scores = await this.scores.getGlobalHighScores(this.map.name, this.rules);
                                                                console.log(scores);
                                                            }
                                                        
                                                       

                                                                                    
                                                                                        startTimer(seconds) {
                                                                                            if (this.timerRunning)
                                                                                                return;
                                                                                            this.timeElement.style.display = "inline-block";
                                                                                            this.timerRunning = true;
                                                                                            this.timeElement.innerHTML = `Время: <b>${seconds}</b>`;
                                                                                            this.timeInterval = setInterval(() => {
                                                                                                seconds -= 0.1;
                                                                                                this.timeElement.innerHTML = `Время: <b>${seconds < 10 ? (Math.round(seconds * 10) / 10).toFixed(1) : Math.round(seconds)}</b>`;
                                                                                            }, 100);
                                                                                            this.timeTimeout = setTimeout(() => {
                                                                                                this.makeGuess({lat: 0, lng: 0});
                                                                                                clearInterval(this.timeInterval);
                                                                                                this.timerRunning = false;
                                                                                            }, seconds * 1000);
                                                                                        }
                                                                                    
                                                                                        endTimer() {
                                                                                            clearTimeout(this.timeTimeout);
                                                                                            clearInterval(this.timeInterval);
                                                                                            this.timerRunning = false;
                                                                                        }
                                                                                    
                                                                                    
                                                                                    //Подготовка игры (Скрытие ненужного, добавление нужного)
                                                                                    
                                                                                        hideGameRuleSelection() {
                                                                                            let element = document.querySelector(".gamerule-selector");
                                                                                            element.style.transform = `translateY(-${element.offsetHeight}px)`;
                                                                                        }
                                                                                    

                                 
                                                                                            setTimeout(() => {
                                                                                                let interval = self.setInterval(() => {
                                                                                                    if (step++ >= steps) {
                                                                                                        clearInterval(interval);
                                                                                                        lineData.line.setPath([guess, actual]);
                                                                                                        return;
                                                                                                    }
                                                                                    
                                                                                                    lineData.line.setPath([
                                                                                                        guess,
                                                                                                        {
                                                                                                            lat: guess.lat - deltaLat * (step / steps),
                                                                                                            lng: guess.lng - deltaLng * (step / steps),
                                                                                                        }
                                                                                                    ]);
                                                                                                }, 1000 / fps);
                                                                                            }, dropTime);
                                                                                    
                                                                                            setTimeout(() => {
                                                                                                lineData.actual = new google.maps.Marker({
                                                                                                    position: actual,
                                                                                                    animation: google.maps.Animation.DROP,
                                                                                                    icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                                                                                                    title: "Загаданное место",
                                                                                                });
                                                                                                lineData.actual.setMap(this.googleMap);
                                                                                            }, animationTime);
                                                                                        }

                                                                                    
                                                                                        measureDistance(from, to) {
                                                                                            return google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(...from), new google.maps.LatLng(...to));
                                                                                        }
                                                                                    
                                                                                        formatDistance(meters) {
                                                                                            if (meters < 1000) {
                                                                                                return `${Math.floor(meters * 10) / 10} м`;
                                                                                            }
                                                                                            if (meters < 20000) {
                                                                                                return `${Math.floor(meters / 100) / 10} км`;
                                                                                            }
                                                                                            return `${Math.floor(meters / 1000)} км`;
                                                                                        }
                                                                                    
                                                                                        placeGuessMarker(location) {
                                                                                            if (this.marker !== undefined) {
                                                                                                this.marker.setMap(null);
                                                                                            }
                                                                                    
                                                                                            this.marker = new google.maps.Marker({
                                                                                                position: location,
                                                                                                map: this.googleMap
                                                                                            });
                                                                                            this.enableGuessButton();
                                                                                        }
                                                                                    

                                                                                            
preloadNext() {
    if (this.mapLoading) return;

    this.mapLoading = true;
    this.mapLoaded = false;

    this.streetview.randomValidLocation(this.zoom)
        .then(next => {
            this.nextDestination = next;

            this.mapLoaded = true;
            this.mapLoading = false;

            this.roundReady = true;

            this.fire("preload");
        })
        .catch(err => {
            console.warn("[preloadNext] failed:", err);

            this.mapLoading = false;
            this.mapLoaded = false;
            this.roundReady = false;
        });
}
                                                                                            
                                                                                          renderRoundOverviewMap(data) {
                                                                                            const { guess, actual, isFinal } = data;
                                                                                        
                                                                                            // всегда сначала готовим карту
                                                                                            this.attachMap(".overview-map");
                                                                                        
                                                                                            // fit
                                                                                            if (isFinal) {
                                                                                                const locations = this.previousGuesses
                                                                                                    .map(r => r.guess)
                                                                                                    .concat(this.previousGuesses.map(r => r.actual));
                                                                                        
                                                                                                this.fitMap(locations);
                                                                                            } else {
                                                                                                this.fitMap([guess, actual]);
                                                                                            }
                                                                                        
                                                                                            // линии
                                                                                            setTimeout(() => {
                                                                                                if (isFinal) {
                                                                                                    for (let r of this.previousGuesses) {
                                                                                                        this.addOverviewLine(r.guess, r.actual, 600);
                                                                                                    }
                                                                                                } else {
                                                                                                    this.addOverviewLine(guess, actual, 600);
                                                                                                }
                                                                                            }, 50);
                                                                                        }


                                                                        resetRoundState() {
                                                                            this.roundState = "idle";
                                                                        
                                                                            Object.values(this.players).forEach(p => {
                                                                                p.state = "idle";
                                                                            });
                                                                        }

    
   
    //Методы игры
    
        prepareGame(map = this.map, rules = this.rules) {
        
            // ---------------- STATE RESET ----------------
            this.map = map;
            this.rules = rules;
            console.log(this.map)
            
            this.state.game = new FSM("prepared");
            this.state.round = new FSM("prepared");
        
            for (const id of Object.keys(this.state.players)) {
                this.state.players[id].fsm = new FSM("prepared");
            }
        
            // ---------------- DATA RESET ----------------
            this.currentRound = 0;
            this.history = [];
            this.currentDestination = null;
            this.nextDestination = null;
        
            // ---------------- ENGINE INIT ----------------
            this.streetview = new Streetview(this.map, this.distribution);
            this.zoom = this.map?.minimumDistanceForPoints < 3000 ? 18 : 14;
        
            this.preloadNext();
            this.fire("gamePrepared", { map: this.map, rules });
        }
    
    startGame() {
        if (!this.state.game.transition("started")) return;
    
        this.startTime = performance.now();
        
        this.prepareRound();
        this.startRound();
    
        this.fire("gameStarted");
    }
    
        prepareRound() {
            //fsm reset
            this.state.round = new FSM("prepared");

            //datareset
            this.mapLoaded = false;
            this.mapLoading = false;
            this.marker?.setMap(null);
            this.marker = null;
        
            this.roundReady = false;
            this.roundStarting = false;
        
            this.preloadNext();
        
            this.fire("roundPrepared");
        }
    
            startRound() {
                if (!this.roundReady || !this.nextDestination) {
                    this.once("preload", () => this.startRound());
                    return;
                }
            
                if (!this.state.round.transition("started")) return;
            
                for (const p of Object.values(this.state.players)) {
                    p.fsm.transition("started");
                }
            
                this.currentRound++;
                this.currentDestination = this.nextDestination;
            
                this.fire("roundStarted", {
                    round: this.currentRound,
                    location: this.currentDestination
                });
            
                this.svElement.setLocation(...this.currentDestination);
            }
    
            finishGuess(playerId = "p1") {
                const player = this.state.players[playerId];
                if (!player || !player.fsm.is("started")) return;
                player.fsm.transition("ended");
            
                if (!this.marker || this.marker.getMap() === null) {
                    this.placeGuessMarker({ lat: 0, lng: 0 });
                }
            
                const guess = [
                    this.marker.position.lat(),
                    this.marker.position.lng()
                ];
            
                this.marker.setMap(null);
            
                const actual = this.currentDestination;
                const distance = this.measureDistance(guess, actual);
                const niceDistance = this.formatDistance(distance);
                const score = this.map.scoreCalculation(distance);
            
                const payload = {
                    playerId,
                    guess,
                    actual,
                    distance,
                    niceDistance,
                    score,
                    round: this.currentRound
                };
            
                this.history.push(payload);
            
                this.fire("guessFinished", payload);
            
                this.checkRoundEnd();
            }
    
            checkRoundEnd() {
                const allEnded = Object.values(this.state.players)
                    .every(p => p.fsm.is("ended"));
                if (!allEnded) return;
                this.endRound();
            }
    
        endRound() {
            if (!this.state.round.transition("ended")) return;
        
            const last = this.history.at(-1) ?? null;
        
            const isLastRound = this.currentRound >= this.rules.roundCount;
        
            const payload = {
                round: this.currentRound,
                history: this.history,
                last
            };
        
            this.fire("roundEnded", payload);
        
            setTimeout(() => {
                if (isLastRound) {
                    this.endGame(payload);
                } else {
                    this.prepareRound();
                    this.startRound();
                }
            }, 3000);
        }
    
    endGame(data) {
        if (!this.state.game.transition("ended")) return;
    
        this.fire("gameEnded", data);
    }
}
















