export class Emitter {
    constructor() { this.events = {}; }

    on(event, handler) {
        if (!this.events[event]) { this.events[event] = new Set(); }
        this.events[event].add(handler);
        return () => this.off(event, handler);
    }

    once(event, handler) {
        const wrapper = (...args) => {
            this.off(event, wrapper);
            handler(...args);
        };
        return this.on(event, wrapper);
    }

    off(event, handler) {
        if (!this.events[event]) return;
        this.events[event].delete(handler);
    }

    fire(event, data) {
        if (!this.events[event]) return;
        for (const handler of this.events[event]) { handler(data); }
    }

    clear(event) {
        if (event) { delete this.events[event]; } else { this.events = {}; }
    }
}
