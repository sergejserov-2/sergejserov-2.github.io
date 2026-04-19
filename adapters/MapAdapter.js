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

    createMarker(map, [lat, lng]) {
        return new google.maps.Marker({
            position: { lat, lng },
            map
        });
    }

    removeMarker(marker) {
        marker.setMap(null);
    }

    fitToMarkers(map, markers) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(m => {
            const p = m.getPosition();
            if (p) bounds.extend(p);
        });
        map.fitBounds(bounds);
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
}
