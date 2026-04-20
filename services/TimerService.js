export class TimerService {
  constructor() {
    this.initial = 0;
    this.remaining = 0;
    this.interval = null;
  }

  start(seconds, onExpire, onTick) {
    this.clear();

    if (seconds === -1) {
      this.remaining = -1;
      return;
    }

    this.initial = seconds;
    this.remaining = seconds;

    onTick?.(this.remaining);

    this.interval = setInterval(() => {
      this.remaining--;

      onTick?.(this.remaining);

      if (this.remaining <= 0) {
        this.clear();
        onExpire?.();
      }
    }, 1000);
  }

  getRemaining() {
    return this.remaining;
  }

  clear() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
