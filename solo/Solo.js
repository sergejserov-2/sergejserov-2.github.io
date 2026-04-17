export function startSolo(game) {
    soloMode(game);
    
    game.element
        .querySelector("#playBtn")
        .addEventListener("click", (e) => startGame(game, e));

    console.log("Запущен соло-режим!");
}

// ---------------- GAME START ----------------
function startGame(game, e) {
    e.preventDefault();
    const form = game.element.querySelector("form");
    const [roundCount, timeLimit, moveLimit, ...restrictions] = [...new FormData(form)].map(n => n[1]);

    const rules = {
        roundCount: +roundCount,
        timeLimit: +timeLimit,
        moveLimit: +moveLimit,
        panAllowed: restrictions.includes("pan"),
        zoomAllowed: restrictions.includes("zoom")
    };

    game.prepareGame(mgame.map, rules);
    game.startGame();
}

function applyRules(game, { rules, round }) {
    game.roundElement.innerHTML = `Раунд: <b>${round}/${rules.roundCount}</b>`;
    if (!rules.panAllowed) { game.svElement.restrictPan(); }
    if (!rules.zoomAllowed) { game.svElement.restrictZoom(); }
    if (rules.moveLimit !== -1) { game.svElement.setMoveLimit(rules.moveLimit, game.movesElement); }
    if (rules.timeLimit !== -1) { game.startTimer(+rules.timeLimit); }
}
function resetRestrictions(game) {
    game.svElement.resetRestrictions();
    game.timeElement.style.display = "none";
    game.movesElement.style.display = "none";
    game.endTimer?.();
}


// ---------------- SCORE ----------------
function calculateScore(history) {
    return history.reduce((sum, h) => sum + h.score, 0);
}

// Overview
function showRoundOverview(game, data) {
    const { history, last } = data;
    const totalScore = calculateScore(history);
    const overviewElement = game.element.querySelector(".guess-overview");
    overviewElement.style.transform = "translateY(0%)";
    overviewElement.querySelector(".next-round-button").style.display = "inline-block";
    overviewElement.querySelector(".game-end-buttons").style.display = "none";
    const progressBar = overviewElement.querySelector(".score-progress");
    progressBar.style.width = `${(last.score / 5000) * 100}%`;
    const [meterElement, scoreElement] = overviewElement.querySelectorAll(".score-text p");
    meterElement.innerText = `Вы в ${last.niceDistance} от загаданного места`;
    scoreElement.innerText = `Ваш счёт за раунд — ${last.score} | Общий — ${totalScore}`;

    game.renderRoundOverviewMap({
        guess: last.guess,
        actual: last.actual,
        isFinal: false
    });
}

function showGameOverview(game, data) {
    const { history, last } = data;
    const totalScore = calculateScore(history);
    const overviewElement = game.element.querySelector(".guess-overview");
    overviewElement.style.transform = "translateY(0%)";
    overviewElement.querySelector(".next-round-button").style.display = "none";
    overviewElement.querySelector(".game-end-buttons").style.display = "block";
    const progressBar = overviewElement.querySelector(".score-progress");
    progressBar.style.width = `${(totalScore / (5000 * game.rules.roundCount)) * 100}%`;
    const [meterElement, scoreElement] = overviewElement.querySelectorAll(".score-text p");
    meterElement.innerText = `Вы в ${last.niceDistance} от загаданного места`;
    scoreElement.innerText = `Итоговый счёт — ${totalScore}`;

    game.latestScore = {
        totalScore,
        map: game.map?.name,
        rules: game.rules,
        individualScores: history.map(h => h.score),
        date: new Date(),
        time: performance.now() - game.startTime
    };

    game.renderRoundOverviewMap({
        guess: last.guess,
        actual: last.actual,
        isFinal: true
    });
}

function hideOverlay (game) {
        const overviewElement = game.element.querySelector(".guess-overview");
        if (overviewElement) { overviewElement.style.transform = "translateY(-100%)"; }
}


// ---------------- SOLO HOOKS ----------------
export function soloMode(game) {
    
    // Раунд начался
    game.on("roundStarted", (data) => {
        hideOverlay(game);
        resetRestrictions(game);
        applyRules(game, {
            rules: game.rules,
            round: data.round
        });
    });    

    // Раунд закончился
    game.on("roundEnded", (data) => {
        showRoundOverview(game, data);
    });

    // Игра закончилась
    game.on("gameEnded", (data) => {
        showGameOverview(game, data);
    });
}



