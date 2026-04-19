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

        this.game.on("roundStarted", ({ round, actual }) => {
            const state = this.game.state;

            this.ui.static.updateHUD(
                this.vm.buildHUD(state, { index: round })
            );

            this.ui.streetview?.setLocation(actual);
            this.ui.map?.reset?.();
        });

        this.game.on("guessFinished", ({ round }) => {
            const state = this.game.state;

            this.ui.static.updateHUD(
                this.vm.buildHUD(state, { index: round })
            );
        });

        this.game.on("roundCommitted", () => {
            const state = this.game.state;
            const round = state.rounds.at(-1);

            this.ui.map?.lock?.();

            this.ui.static.showRoundResult(
                this.vm.buildRoundVM(state, round)
            );
        });

        this.game.on("gameEnded", () => {
            this.ui.static.showGameResult(
                this.vm.buildGameVM(this.game.state)
            );
        });
    }
}
