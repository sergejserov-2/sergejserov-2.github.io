export class Bridge {
    constructor({ game, ui, vm }) {
        this.game = game;
        this.ui = ui;
        this.vm = vm;

        this.bind();
    }

    bind() {
        this.game.on("gameStarted", (state) => {
            this.ui.static.showGame(state);
        });

        this.game.on("roundStarted", (round) => {
            this.ui.static.updateHUD(this.vm.buildHUD(round));
            this.ui.map?.reset?.();
        });

        this.game.on("guessFinished", (round) => {
            this.ui.static.updateHUD(this.vm.buildHUD(round));
        });

        this.game.on("roundCommitted", (round) => {
            this.ui.map?.lock?.();
            this.ui.map?.renderOverview?.(round);
            this.ui.static.showRoundResult(this.vm.buildRoundVM(round));
        });

        this.game.on("gameEnded", (state) => {
            this.ui.static.showGameResult(this.vm.buildGameVM(state));
        });
    }
}
