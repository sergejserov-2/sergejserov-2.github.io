// Здесь основная логика игры: Флажки, угадывание, расчёт точек и т.п.

import { Scores } from "./Scores.js";
import { StreetviewElement } from "./StreetviewElement.js";
import { Streetview } from "./Streetview.js";

export const distribution = { weighted: 0, uniform: 1 }; 
export class Game {
    constructor(map, element, rules = {
        roundCount: 5,
        moveLimit: -1,
        panAllowed: true,
        timeLimit: -1,
        zoomAllowed: true
    }) {
        if (localStorage.user !== undefined) element.querySelector(".username-input").value = localStorage.user;
        if (map.name === "my_area") element.querySelector(".high-score-form").style.display = "none";

        this.ezMode = false;
        this.distribution = distribution.weighted;
        this.element = element;
        this.svElement = new StreetviewElement(element.querySelector(".streetview"), element.querySelector(".return-home"));
        this.scoreElement = element.querySelector(".total-score");
        this.timeElement = element.querySelector(".time-left");
        this.movesElement = element.querySelector(".moves-left");
        this.roundElement = element.querySelector(".round");
        this.scores = new Scores();
        
        this.googleMap = new google.maps.Map(element.querySelector(".map-element"), {
            zoom: 0,
            center: {lat: 0, lng: 0},
            disableDefaultUI: true,
            clickableIcons: false,
            backgroundColor: "#aadaff",
            fullscreenControl: false,
        });
        this.attachMap(".embed-map");
        google.maps.event.addListener(this.googleMap, "click", e => {
            if (this.googleMap.getDiv().parentElement.attributes.class.value === "embed-map")
                this.placeGuessMarker(e.latLng);
        });
        this.setResizeEventListeners();
        this.currentRound = 0;
        this.map = map;
        this.rules = null;
        this.events = {};
        this.currentRound = 0;
        this.nextDestination = null;
        this.currentDestination = null;

        document.getElementById("makeGuess").addEventListener("click", () => {this.makeGuess(); });
        document.getElementById("returnHome").addEventListener("click", () => {this.returnHome();});
        document.getElementById("mapOverlay").addEventListener("click", () => {game.toggleMapOverlay();});
        
        //Фазы механизьму
        this.state = {
          game: "idle",     // idle | running | ended
          round: "idle",    // idle | running | ended
          players: {
            p1: { state: "idle" }
          }
        };
    }

    transition(event, payload = {}) {
        const s = this.state;
    
        switch (event) {
    
            case "GAME_START":
                if (s.game !== "idle") return;
                
                s.game = "running";
                this.startGame();
                break;
    
            case "ROUND_PREPARE":
                if (s.game !== "running") return;
                
                s.round = "idle";
                this.prepareRound();
                break;
    
            case "ROUND_START":
                if (s.round !== "idle") return;
                if (!this.mapLoaded) {
                    this.once("preload", () => this.transition("ROUND_START"));
                    return;
                }
    
                s.round = "running";
                this.startRound();
                break;
    
            case "PLAYER_GUESS":
                const player = s.players[payload.playerId];
                if (!player || player.state !== "running") return;
    
                this.makeGuess(payload.playerId);
                break;
    
            case "ROUND_END":
                if (s.round !== "running") return;
    
                s.round = "ended";
                this.endRound();
                break;
    
            case "GAME_END":
                if (s.game !== "running") return;
    
                s.game = "ended";
                this.endGame(payload.last);
                break;
        }
    }

                                                    /*  async uploadScore(e) {
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
                                                        
                                                        */


                                                                                    
                                                                                  
                                                                                    //Таймер
                                                                                    
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
                                                                                    
                                                                                        attachMap(selector) {
                                                                                            let mapElement = this.googleMap.getDiv();
                                                                                            mapElement.remove();
                                                                                            this.element.querySelector(selector).appendChild(mapElement);
                                                                                        }
                                                                                    
                                                                                        toggleMapOverlay() {
                                                                                            if (this.map.polygon.getMap())
                                                                                                this.map.polygon.setMap(null);
                                                                                            else
                                                                                                this.map.polygon.setMap(this.googleMap);
                                                                                        }
                                                                                    
                                                                                        setResizeEventListeners() {
                                                                                            let resizeElement = this.element.querySelector(".guess-map-resizer");
                                                                                            let resizerDown = false;
                                                                                            let guessMap = this.element.querySelector(".guess-map");
                                                                                    
                                                                                            let onMove = (x, y) => {
                                                                                                if (resizerDown) {
                                                                                                    let height = window.innerHeight - y - this.element.offsetTop;
                                                                                                    let width = x - this.element.offsetLeft;
                                                                                                    guessMap.style.height = height + "px";
                                                                                                    guessMap.style.width = width + "px";
                                                                                                }
                                                                                            };
                                                                                            let onDown = () => {
                                                                                                resizerDown = true;
                                                                                            };
                                                                                            let onUp = () => {
                                                                                                resizerDown = false;
                                                                                            };
                                                                                    
                                                                                            resizeElement.addEventListener("mousedown", () => onDown());
                                                                                            document.addEventListener("mousemove", e => onMove(e.pageX, e.pageY));
                                                                                            document.addEventListener("mouseup", () => onUp());
                                                                                    
                                                                                            resizeElement.addEventListener("touchstart", () => onDown());
                                                                                            document.addEventListener("touchmove", e => onMove(e.touches[0].pageX, e.touches[0].pageY));
                                                                                            document.addEventListener("touchend", () => onUp());
                                                                                        }
                                                                                    
                                                                                    
                                                                                        fitMapToGeoMap() {
                                                                                            this.googleMap.fitBounds(this.map.getBounds());
                                                                                        }
                                                                                    
                                                                                        fitMap(positions) {
                                                                                            let bounds = new google.maps.LatLngBounds();
                                                                                            for (let location of positions) {
                                                                                                bounds.extend({
                                                                                                    lat: location[0],
                                                                                                    lng: location[1]
                                                                                                });
                                                                                            }
                                                                                            this.googleMap.fitBounds(bounds);
                                                                                        }
                                                                                    
                                                                                    
                                                                                        removeOverviewLines() {
                                                                                            for (let lineData of this.overviewLines) {
                                                                                                lineData.line.setMap(null);
                                                                                                lineData.guess.setMap(null);
                                                                                                lineData.actual.setMap(null);
                                                                                            }
                                                                                        }
                                                                                    
                                                                                        addOverviewLine(guess, actual, animationTime = 1500) {
                                                                                            guess = {lat: guess[0], lng: guess[1]};
                                                                                            actual = {lat: actual[0], lng: actual[1]};
                                                                                    
                                                                                            let lineData = {};
                                                                                            this.overviewLines.push(lineData);
                                                                                    
                                                                                            lineData.line = new google.maps.Polyline({
                                                                                                path: [guess, guess],
                                                                                                geodesic: true,
                                                                                                strokeColor: "red",
                                                                                                strokeOpacity: 0.8,
                                                                                                strokeWeight: 3,
                                                                                                map: this.googleMap
                                                                                            });
                                                                                    
                                                                                            let dropTime = 250;
                                                                                            let fps = 30;
                                                                                            let steps = fps * (animationTime / 1000);
                                                                                            let step = 0;
                                                                                            let deltaLat = guess.lat - actual.lat;
                                                                                            let deltaLng = guess.lng - actual.lng;
                                                                                    
                                                                                            lineData.guess = new google.maps.Marker({
                                                                                                position: guess,
                                                                                                map: this.googleMap,
                                                                                                animation: google.maps.Animation.DROP,
                                                                                                title: "Вы",
                                                                                            });
                                                                                    
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
                                                                                    
                                                                                        disableGuessButton() {
                                                                                            let button = this.element.querySelector(".guess-button");
                                                                                            button.style.pointerEvents = "none";
                                                                                            button.style.filter = "grayscale(90%)";
                                                                                        }
                                                                                    
                                                                                        enableGuessButton() {
                                                                                            let button = this.element.querySelector(".guess-button");
                                                                                            button.style.pointerEvents = "all";
                                                                                            button.style.filter = "grayscale(0%)";
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
                                                                                    
                                                                                            returnHome() {
                                                                                                this.svElement.setLocation(...this.currentDestination);
                                                                                            }
                                                                                            
                                                                                            preloadNextMap() {
                                                                                                this.mapLoaded = false;
                                                                                            
                                                                                                this.streetview.randomValidLocation(this.zoom).then(next => {
                                                                                                    this.nextDestination = next;
                                                                                                    this.mapLoaded = true;
                                                                                                    this.fire("preload");
                                                                                                });
                                                                                            }
                                                                                            
                                                                                            // ✅ новый метод
                                                                                            showOverviewLines({ guess, actual, isFinal }) {
                                                                                                setTimeout(() => {
                                                                                                    if (isFinal) {
                                                                                                        for (let r of this.history) {
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

    prepareGame(rules = this.rules) {
        if (!this.map) {
            throw new Error("Map is required before prepareGame");
        }
    
        this.rules = rules;
    
        this.state = {
            game: "idle",
            round: "idle",
            players: {
                p1: { state: "idle" }
            }
        };
    
        this.currentRound = 0;
        this.history = [];
    
        this.overviewLines = [];
    
        this.streetview = new Streetview(this.map, this.distribution);
    
        this.zoom =
            this.map.minimumDistanceForPoints < 3000 ? 18 : 14;
    
        this.preloadNextMap();
    }

startGame() {
    this.startTime = performance.now();
    this.hideGameRuleSelection?.();
    this.transition("ROUND_PREPARE");
    this.transition("ROUND_START");
}

    // ---------------- ROUND FLOW ----------------

    prepareRound() {
        this.roundState = "idle";

        this.preloadNextMap();

        this.nextDestination =
            this.svElement.getLocation?.() ?? this.nextDestination;
    }

    startRound() {
        this.currentRound++;
        Object.values(this.state.players).forEach(p => { p.state = "running"; });
        this.currentDestination = this.nextDestination;
        this.disableGuessButton();
        this.applyRules?.();

        this.fire("startRound", {
            round: this.currentRound,
            location: this.currentDestination
        });

        setTimeout(() => {
            this.fire("initRoundUI");
            this.removeOverviewLines();
            this.attachMap(".embed-map");
            this.fitMapToGeoMap();
        }, 300);
        this.svElement.setLocation(...this.currentDestination);
    }

    // ---------------- GAMEPLAY ----------------

    makeGuess(playerId) {
        const player = this.state.players[playerId];

        if (!player || player.state !== "running") return;

        player.state = "ended";

        if (!this.marker || this.marker.getMap() === null) {
            this.placeGuessMarker({ lat: 0, lng: 0 });
        }

        this.marker.setMap(null);
        this.endTimer();

        const guess = [
            this.marker.position.lat(),
            this.marker.position.lng()
        ];

        const actual = this.ezMode
            ? this.svElement.getLocation()
            : this.currentDestination;

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

        // SOURCE OF TRUTH
        this.history.push(payload);

        this.fire("guessFinished", payload);

        this.checkRoundEnd();
    }

    checkRoundEnd() {
        const allEnded = Object
            .values(this.state.players)
            .every(p => p.state === "ended");
    
        if (allEnded) {
            this.transition("ROUND_END");
        }
    }

    // ---------------- ROUND END ----------------

    endRound() {
        const isLastRound =
            this.currentRound >= this.rules.roundCount;
    
        const last = this.history.at(-1) ?? null;
    
        if (isLastRound) {
            this.transition("GAME_END", { last });
            return;
        }
    
        this.fire("endRound", {
            round: this.currentRound,
            history: this.history,
            last
        });
    
        this.transition("ROUND_PREPARE");
        this.transition("ROUND_START");
    }


    // ---------------- GAME END ----------------

    endGame(lastPayload) {
        this.gameState = "ended";
        this.roundState = "idle";

        const playersScores = this.computeFinalScores();

        this.fire("endGame", {
            history: this.history,
            players: playersScores,
            last: lastPayload
        });
    }



    
//Действия
    fire(event, data) {
        if (this.events[event]) {
            for (let i = this.events[event].length - 1; i >= 0; i--) {
                this.events[event][i](data);
            }
        }
    }

    once(event, callback) {
        let onceCallback = () => {
            callback();
            this.off(event, onceCallback);
        }
        this.on(event, onceCallback);
    }

    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    off(event, callback) {
        if (event in this.events) {
            this.events[event].splice(this.events[event].indexOf(callback), 1);
        } else {
            console.warn(`Trying to remove ${event} event, but it does not exist`);
        }
    }
}
