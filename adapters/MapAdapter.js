export class MapAdapter {
    constructor() {
        this.svService = new google.maps.StreetViewService();
    }

    createMap(element, { center = [0,0], zoom = 2 } = {}) {
        return new google.maps.Map(element, {
            center: { lat: center[0], lng: center[1] },
            zoom,
            disableDefaultUI: true
        });
    }

    createPanorama(element) {
        return new google.maps.StreetViewPanorama(element, {
            disableDefaultUI: true
        });
    }

    setPanoramaPosition(panorama, lat, lng) {
        panorama.setPosition({ lat, lng });
    }

    async hasStreetView(lat, lng) {
        return new Promise(resolve => {
            this.svService.getPanorama(
                { location: { lat, lng }, radius: 50000 },
                (data, status) => {
                    resolve(status === google.maps.StreetViewStatus.OK);
                }
            );
        });
    }

    createMarker(map, [lat, lng]) {
        return new google.maps.Marker({
            position: { lat, lng },
            map
        });
    }

    moveMarker(marker, [lat, lng]) {
        marker.setPosition({ lat, lng });
    }

    removeMarker(marker) {
        marker.setMap(null);
    }

    fitToMarkers(map, markers) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(m => {
            const pos = m.getPosition();
            if (pos) bounds.extend(pos);
        });
        map.fitBounds(bounds);
    }

    resetPanorama(panorama) {
        panorama.setPov({ heading: 0, pitch: 0 });
    }
}
