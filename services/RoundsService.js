export class RoundsService {
  constructor() {
    this.limit = 0;
    this.current = 0;
  }

  start(limit) {
    this.limit = limit;
    this.current = 0;
  }

  next() {
    this.current++;
  }

  getCurrent() {
    return this.current;
  }

  isFinished() {
    return this.limit !== -1 && this.current >= this.limit;
  }
}
