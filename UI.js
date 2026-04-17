import { StreetviewElement } from "./StreetviewElement.js";

export class UI {

    constructor(game) {
        this.game = game;
        this.element = game.element;

        this.svElement = new StreetviewElement(
            this.element.querySelector(".streetview"),
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
    }

    // =====================================================
    // MAP INIT
    // =====================================================

    initMapUI({ polygon, isEmbedMode = true } = {}) {
        this.googleMap = new google.maps.Map(
            this.element.querySelector(".map-element"),
            {
                zoom: 0,
                center: { lat: 0, lng: 0 },
                disableDefaultUI: true,
                clickableIcons: false
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

    attachMap(selector) {
        const el = this.googleMap.getDiv();
        el.remove();
        this.element.querySelector(selector).appendChild(el);
    }

    // =====================================================
    // HUD (LIVE)
    // =====================================================

    returnHome() {
        this.game.fire("returnHomeRequested", {
            location: this.game.currentDestination
        });
    }
    
    updateRoundHUD(data) {
        const { round, roundCount, score, time, moves } = data;

        this.roundElement.innerHTML = `Раунд: <b>${round}/${roundCount}</b>`;
        this.scoreElement.innerHTML = `Счёт: <b>${score}</b>`;
        this.timeElement.innerHTML = `Время: <b>${time}</b>`;
        this.movesElement.innerHTML = `Шаги: <b>${moves}</b>`;
    }

    // =====================================================
    // OVERVIEW SCREENS (ВОЗВРАЩЕНО)
    // =====================================================

    showRoundOverview(data) {
        const el = this.element.querySelector(".guess-overview");

        el.style.transform = "translateY(0%)";

        el.querySelector(".next-round-button").style.display = "inline-block";
        el.querySelector(".game-end-buttons").style.display = "none";

        const progressBar = el.querySelector(".score-progress");
        progressBar.style.width = `${(data.score / 5000) * 100}%`;

        const [meter, scoreText] = el.querySelectorAll(".score-text p");

        meter.innerText =
            `Вы в ${data.niceDistance} от загаданного места`;

        scoreText.innerText =
            `Ваш счёт — ${data.score} | Общий — ${data.totalScore}`;

        this.renderRoundOverviewMap({
            lines: [{ guess: data.guess, actual: data.actual }],
            focus: { guess: data.guess, actual: data.actual },
            isFinal: false
        });
    }

    showGameOverview(data) {
        const el = this.element.querySelector(".guess-overview");

        el.style.transform = "translateY(0%)";

        el.querySelector(".next-round-button").style.display = "none";
        el.querySelector(".game-end-buttons").style.display = "block";

        const progressBar = el.querySelector(".score-progress");
        progressBar.style.width =
            `${(data.totalScore / (5000 * data.roundCount)) * 100}%`;

        const [meter, scoreText] = el.querySelectorAll(".score-text p");
            meter.innerText =
            `Вы в ${data.history.at(-1).niceDistance} от загаданного места`;

        scoreText.innerText =
            `Итоговый счёт — ${data.totalScore}`;

        this.renderRoundOverviewMap({
            lines: data.history.map(h => ({
                guess: h.guess,
                actual: h.actual
            })),
            focus: {
                guess: data.history.at(-1).guess,
                actual: data.history.at(-1).actual
            },
            isFinal: true
        });
    }

    // =====================================================
    // MAP OVERVIEW RENDER
    // =====================================================

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

    fitMap(positions) {
        if (!positions?.length) return;

        const bounds = new google.maps.LatLngBounds();

        for (const p of positions) {
            bounds.extend({ lat: p[0], lng: p[1] });
        }

        this.googleMap.fitBounds(bounds);
    }

    // =====================================================
    // MARKER
    // =====================================================

    placeGuessMarker(location) {
        if (this.marker) this.marker.setMap(null);

        this.marker = new google.maps.Marker({
            position: location,
            map: this.googleMap
        });
    }

    clearGuessMarker() {
        if (this.marker) this.marker.setMap(null);
        this.marker = null;
    }

    removeOverviewLines() {
        for (const l of this.overviewLines) {
            l.line.setMap(null);
            l.guess.setMap(null);
            l.actual.setMap(null);
        }
        this.overviewLines = [];
    }
}
