export class MapAdapter {
    constructor() {
        this.svService = new google.maps.StreetViewService();
    }

    // =========================
    // MAP
    // =========================

    createMap(element, { center = [0, 0], zoom = 2 } = {}) {
        return new google.maps.Map(element, {
            center: { lat: center[0], lng: center[1] },
            zoom,
            disableDefaultUI: true
        });
    }

    createMarker(map, [lat, lng]) {
        return new google.maps.Marker({
            position: { lat, lng },
            map
        });
    }

    removeMarker(marker) {
        marker?.setMap(null);
    }

    createPolyline(map, path) {
        return new google.maps.Polyline({
            path,
            geodesic: true,
            strokeOpacity: 1,
            strokeWeight: 2,
            map
        });
    }

    fitToMarkers(map, markers) {
        const bounds = new google.maps.LatLngBounds();

        markers.forEach(m => {
            const pos = m.getPosition();
            if (pos) bounds.extend(pos);
        });

        map.fitBounds(bounds);
    }

    // =========================
    // STREET VIEW (FIXED)
    // =========================

    createStreetView(element) {
        return new google.maps.StreetViewPanorama(element, {
            addressControl: false,
            showRoadLabels: false,
            fullscreenControl: false,
            zoomControl: true
        });
    }
}
