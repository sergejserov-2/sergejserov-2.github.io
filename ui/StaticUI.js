export class StaticUI {
    constructor({ element }) {
        this.element = element;
        this.roundEl = element.querySelector(".round");
        this.scoreEl = element.querySelector(".total-score");
        this.timeEl = element.querySelector(".time-left");
        this.movesEl = element.querySelector(".moves-left");
        this.loadingOverlay = element.querySelector(".loading-screen");
        this.resultScreen = element.querySelector(".guess-overview");
        this.progressBar = document.querySelector(".score-progress");
        this.textEls = document.querySelectorAll(".score-text p");
        this.nextBtn = element.querySelector(".next-round-button");
        this.endButtons = element.querySelector(".game-end-buttons");
        this.form = element.querySelector(".high-score-form");
    }

    showGame(){this.element.classList.remove("hidden");}
    hideGame(){this.element.classList.add("hidden");}
    showLoading(){this.loadingOverlay?.style&&(this.loadingOverlay.style.display="flex");}
    hideLoading(){this.loadingOverlay?.style&&(this.loadingOverlay.style.display="none");}

    updateHUD(vm){
        if(!vm)return;
        if(this.roundEl)this.roundEl.innerHTML=vm.roundText;
        if(this.scoreEl)this.scoreEl.innerHTML=vm.scoreText;
        if(this.timeEl)this.timeEl.innerHTML=vm.timeText;
        if(this.movesEl)this.movesEl.innerHTML=vm.movesText;
    }

    startRound(){
        this.hideLoading();
        this.hideResult();
    }

    showRoundResult(vm){
        this.showResult();
        if(this.progressBar)this.progressBar.style.width=`${vm.progress}%`;
        if(this.textEls?.length>=2){
            this.textEls[0].innerText=vm.distanceText;
            this.textEls[1].innerText=vm.scoreText+" | "+vm.totalScoreText;
        }
        if(this.nextBtn)this.nextBtn.style.display="inline-block";
        if(this.endButtons)this.endButtons.style.display="none";
    }

    showGameResult(vm){
        this.showResult();
        if(this.progressBar)this.progressBar.style.width=`${vm.progress}%`;
        if(this.textEls?.length>=2){
            this.textEls[0].innerText=vm.lastRoundText;
            this.textEls[1].innerText=vm.finalScoreText;
        }
        if(this.nextBtn)this.nextBtn.style.display="none";
        if(this.endButtons)this.endButtons.style.display="block";
    }

    showResult(){this.resultScreen?.classList.add("active");}
    hideResult(){this.resultScreen?.classList.remove("active");}

    bindScoreSubmit(handler){
        if(!this.form)return;
        this.form.addEventListener("submit",e=>{
            e.preventDefault();
            const input=this.form.querySelector(".username-input");
            handler
