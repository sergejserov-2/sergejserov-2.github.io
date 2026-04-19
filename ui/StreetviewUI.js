export class StreetViewUI {
    constructor({ adapter, element }) {
        this.adapter = adapter;
        this.element = element;
        this.pano = null;
    }

    init() {
        this.pano = new google.maps.StreetViewPanorama(this.element, {
            addressControl: false,
            showRoadLabels: false,
            fullscreenControl: false,
            zoomControl: true
        });
    }

    setLocation([lat, lng]) {
        this.pano?.setPosition({ lat, lng });
    }

    lock() {
        this.pano.setOptions({ disableDefaultUI: true });
    }

    unlock() {
        this.pano.setOptions({ disableDefaultUI: false });
    }

    reset() {
        this.unlock();
    }
}
