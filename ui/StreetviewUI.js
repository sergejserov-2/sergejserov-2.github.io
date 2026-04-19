export class StreetViewUI {
    constructor({ adapter, element }) {
        this.adapter = adapter;
        this.element = element;
        this.panorama = null;
    }

    init() {
        this.panorama = this.adapter.createPanorama(this.element);
    }

    async trySetLocation([lat, lng]) {
        const ok = await this.adapter.hasStreetView(lat, lng);
        if (!ok) return false;
        this.adapter.setPanoramaPosition(this.panorama, lat, lng);
        return true;
    }

    reset() {
        if (!this.panorama) return;
        this.adapter.resetPanorama?.(this.panorama);
    }
}
