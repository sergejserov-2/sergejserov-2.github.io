export class Bridge {
    constructor({ game, ui, vm }) {
        this.game = game;
        this.ui = ui;
        this.vm = vm;

        this.bind();
    }

    bind() {
        this.game.on("gameStarted", () => {
            this.ui.static.showGame();
        });

        this.game.on("roundStarted", (round) => {
            this.ui.static.updateHUD(
                this.vm.buildHUD(round)
            );

            this.ui.map?.reset?.();
        });

        this.game.on("guessFinished", (round) => {
            this.ui.static.updateHUD(
                this.vm.buildHUD(round)
            );
        });

        this.game.on("roundCommitted", (round) => {
            this.ui.map?.lock?.();

            this.ui.static.showRoundResult(
                this.vm.buildRoundVM(round)
            );
        });

        this.game.on("gameEnded", () => {
            this.ui.static.showGameResult(
                this.vm.buildGameVM(this.game.state)
            );
        });
    }
}
