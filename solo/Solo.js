//upd57
export function startSolo(game) {
    soloMode(game);
    game.element
        .querySelector("#playBtn")
        .addEventListener("click", (e) => startGame(game, e));

    console.log("Запущен соло-режим!");
}

import { StreetviewElement } from "./StreetviewElement.js";

export class Ui {

    // =========================================================
    // 2А — CONSTRUCTOR
    // =========================================================

    constructor(game) {
        this.game = game;
        this.element = game.element;

        this.svElement = new StreetviewElement(
            this.element.querySelector(".streetview"),
            this.element.querySelector(".return-home")
        );

        this.scoreElement = this.element.querySelector(".total-score");
        this.timeElement = this.element.querySelector(".time-left");
        this.movesElement = this.element.querySelector(".moves-left");
        this.roundElement = this.element.querySelector(".round");

        this.googleMap = null;
        this.marker = null;
        this.overviewLines = [];
        this.polygon = null;
        this.isEmbedMode = true;
        this.timerInterval = null;
    }

    // =========================================================
    // 2Б — MAPS
    // =========================================================

    initMapUI({ polygon, isEmbedMode = true } = {}) {
        this.googleMap = new google.maps.Map(
            this.element.querySelector(".map-element"),
            {
                zoom: 0,
                center: { lat: 0, lng: 0 },
                disableDefaultUI: true,
                clickableIcons: false,
                backgroundColor: "#aadaff",
                fullscreenControl: false,
            }
        );

        this.polygon = polygon;
        this.isEmbedMode = isEmbedMode;

        this.attachMap(".embed-map");

        google.maps.event.addListener(this.googleMap, "click", (e) => {
            if (!this.isEmbedMode) return;
            this.placeGuessMarker(e.latLng);
        });

        this.setResizeEventListeners();
    }

    toggleMapOverlay() {
        if (!this.polygon) return;

        if (this.polygon.getMap()) {
            this.polygon.setMap(null);
        } else {
            this.polygon.setMap(this.googleMap);
        }
    }

    attachMap(selector) {
        const mapElement = this.googleMap.getDiv();
        mapElement.remove();
        this.element.querySelector(selector).appendChild(mapElement);
    }

    setResizeEventListeners() {
        const resizeElement = this.element.querySelector(".guess-map-resizer");
        const guessMap = this.element.querySelector(".guess-map");

        let resizerDown = false;

        const onMove = (x, y) => {
            if (!resizerDown) return;

            const height = window.innerHeight - y - this.element.offsetTop;
            const width = x - this.element.offsetLeft;

            guessMap.style.height = height + "px";
            guessMap.style.width = width + "px";
        };

        resizeElement.addEventListener("mousedown", () => (resizerDown = true));
        document.addEventListener("mousemove", (e) => onMove(e.pageX, e.pageY));
        document.addEventListener("mouseup", () => (resizerDown = false));

        resizeElement.addEventListener("touchstart", () => (resizerDown = true));
        document.addEventListener("touchmove", (e) =>
            onMove(e.touches[0].pageX, e.touches[0].pageY)
        );
        document.addEventListener("touchend", () => (resizerDown = false));
    }

    placeGuessMarker(location) {
        if (!location) return;

        if (this.marker) {
            this.marker.setMap(null);
        }

        this.marker = new google.maps.Marker({
            position: location,
            map: this.googleMap,
        });

        this.enableGuessButton();
    }

    clearGuessMarker() {
        if (!this.marker) return;
        this.marker.setMap(null);
        this.marker = null;
    }

    enableGuessButton() {
        const button = this.element.querySelector(".guess-button");
        button.style.pointerEvents = "all";
        button.style.filter = "grayscale(0%)";
    }
    disableGuessButton() {
        const button = this.element.querySelector(".guess-button");
        button.style.pointerEvents = "none";
        button.style.filter = "grayscale(90%)";
    }

    // ---------- OVERVIEW MAP ----------

    renderRoundOverviewMap(data) {
        const { lines, focus, isFinal } = data;

        this.attachMap(".overview-map");

        const locations = isFinal
            ? lines.flatMap(l => [l.guess, l.actual])
            : [focus.guess, focus.actual];

        this.fitMap(locations);

        setTimeout(() => {
            if (isFinal) {
                lines.forEach(l =>
                    this.addOverviewLine(l.guess, l.actual, 600)
                );
            } else {
                this.addOverviewLine(focus.guess, focus.actual, 600);
            }
        }, 50);
    }

    removeOverviewLines() {
        for (const lineData of this.overviewLines) {
            lineData.line.setMap(null);
            lineData.guess.setMap(null);
            lineData.actual.setMap(null);
        }
        this.overviewLines = [];
    }

    addOverviewLine(guess, actual, animationTime = 1500) {
        const g = { lat: guess[0], lng: guess[1] };
        const a = { lat: actual[0], lng: actual[1] };

        const lineData = {};
        this.overviewLines.push(lineData);

        lineData.line = new google.maps.Polyline({
            path: [g, g],
            geodesic: true,
            strokeColor: "red",
            strokeOpacity: 0.8,
            strokeWeight: 3,
            map: this.googleMap,
        });

        const dropTime = 250;
        const fps = 30;
        const steps = fps * (animationTime / 1000);
        let step = 0;

        const deltaLat = g.lat - a.lat;
        const deltaLng = g.lng - a.lng;

        lineData.guess = new google.maps.Marker({
            position: g,
            map: this.googleMap,
            animation: google.maps.Animation.DROP,
            title: "Вы",
        });

        setTimeout(() => {
            const interval = setInterval(() => {
                if (step++ >= steps) {
                    clearInterval(interval);
                    lineData.line.setPath([g, a]);
                    return;
                }

                lineData.line.setPath([
                    g,
                    {
                        lat: g.lat - deltaLat * (step / steps),
                        lng: g.lng - deltaLng * (step / steps),
                    },
                ]);
            }, 1000 / fps);
        }, dropTime);

        setTimeout(() => {
            lineData.actual = new google.maps.Marker({
                position: a,
                animation: google.maps.Animation.DROP,
                icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                title: "Загаданное место",
            });

            lineData.actual.setMap(this.googleMap);
        }, animationTime);
    }

    fitMap(positions) {
        if (!positions?.length) return;

        const bounds = new google.maps.LatLngBounds();

        for (const p of positions) {
            bounds.extend({ lat: p[0], lng: p[1] });
        }

        this.googleMap.fitBounds(bounds);
    }

    // =========================================================
    // 2В — TIMER
    // =========================================================

    startTimer(duration) {
        this.stopTimer();

        let time = duration;
        this.timeElement.textContent = time;

        this.timerInterval = setInterval(() => {
            time--;
            this.timeElement.textContent = time;

            if (time <= 0) {
                this.stopTimer();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    endTimer() {
        this.stopTimer();
    }

    // =========================================================
    // 2Г — SCREENS
    // =========================================================
    showLobby() {
        const el = this.element.querySelector(".gamerule-selector");
        if (el) el.style.transform = "translateY(0%)";
    }

    hideLobby() {
        const el = this.element.querySelector(".gamerule-selector");
        if (el) el.style.transform = "translateY(-100%)";
    }

    showRoundUI({ round, roundCount }) {
        this.roundElement.innerHTML =
            `Раунд: <b>${round}/${roundCount}</b>`;
    }

    hideOverview() {
        const el = this.element.querySelector(".guess-overview");
        if (el) el.style.transform = "translateY(-100%)";
    }

    showRoundOverview(data) {
        const {
            guess,
            actual,
            distance,
            niceDistance,
            score,
            totalScore,
        } = data;

        const el = this.element.querySelector(".guess-overview");
        if (!el) return;

        el.style.transform = "translateY(0%)";

        el.querySelector(".next-round-button").style.display = "inline-block";
        el.querySelector(".game-end-buttons").style.display = "none";

        const progressBar = el.querySelector(".score-progress");
        if (progressBar) {
            progressBar.style.width = `${(score / 5000) * 100}`%;
        }

        const [meterElement, scoreElement] =
            el.querySelectorAll(".score-text p");

        if (meterElement) {
            meterElement.innerText =
                `Вы в ${niceDistance} от загаданного места`;
        }

        if (scoreElement) {
            scoreElement.innerText =
                `Ваш счёт за раунд — ${score} | Общий — ${totalScore}`;
        }

        this.renderRoundOverviewMap({
            lines: [{ guess, actual }],
            focus: { guess, actual },
            isFinal: false,
        });
    }

    showGameOverview(data) {
        const {
            history,
            last,
            totalScore,
            roundCount,
        } = data;

        const el = this.element.querySelector(".guess-overview");
        if (!el) return;

        el.style.transform = "translateY(0%)";

        el.querySelector(".next-round-button").style.display = "none";
        el.querySelector(".game-end-buttons").style.display = "block";

        const progressBar = el.querySelector(".score-progress");
        if (progressBar) {
            progressBar.style.width =
                `${(totalScore / (5000 * roundCount)) * 100}`%;
        }

        const [meterElement, scoreElement] =
            el.querySelectorAll(".score-text p");

        if (meterElement) {
            meterElement.innerText =
                `Вы в ${last.niceDistance} от загаданного места`;
        }

        if (scoreElement) {
            scoreElement.innerText =
                `Итоговый счёт — ${totalScore}`;
        }

        this.renderRoundOverviewMap({
            lines: history.map(h => ({
                guess: h.guess,
                actual: h.actual,
            })),
            focus: {
                guess: last.guess,
                actual: last.actual,
            },
            isFinal: true,
        });
    }
}
