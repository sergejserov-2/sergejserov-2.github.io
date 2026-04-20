export class MoveService {
  constructor() {
    this.limit = -1;
    this.remaining = -1;
  }

  reset(limit) {
    this.limit = limit;
    this.remaining = limit;
  }

  consume() {
    if (this.limit === -1) return true;

    if (this.remaining <= 0) {
      return false;
    }

    this.remaining--;
    return this.remaining >= 0;
  }

  getRemaining() {
    return this.remaining;
  }

  isLocked() {
    return this.limit !== -1 && this.remaining <= 0;
  }
}
