export class StreetViewUI {
    constructor({ adapter, element }) {
        this.adapter = adapter;
        this.element = element;
        this.panorama = null;
    }

    init() {
        this.panorama = this.adapter.createPanorama(this.element);
    }

    setLocation([lat, lng]) {
        if (!this.panorama) return;

        this.adapter.setPanoramaPosition(this.panorama, lat, lng);
    }

    reset() {
        if (!this.panorama) return;

        this.adapter.resetPanorama?.(this.panorama);
    }
}
