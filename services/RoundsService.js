export class RoundsService {
  constructor() {
    this.totalRounds = 0;
  }

  start(totalRounds) {
    this.totalRounds = totalRounds;
  }

  getTotal() {
    return this.totalRounds;
  }

  isFinished(currentIndex) {
    return currentIndex >= this.totalRounds;
  }
}
