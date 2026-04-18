export class MapAdapter {
    constructor(google) {
        this.google = google;
    }

    hasStreetView(lat, lng) {
        const sv = new this.google.maps.StreetViewService();

        return new Promise((resolve) => {
            sv.getPanorama(
                { location: { lat, lng }, radius: 50 },
                (data, status) => {
                    resolve(status === this.google.maps.StreetViewStatus.OK);
                }
            );
        });
    }

    containsPoint(point, polygon) {
        return this.google.maps.geometry.poly.containsLocation(
            new this.google.maps.LatLng(point.lat, point.lng),
            polygon
        );
    }

    distance(a, b) {
        return this.google.maps.geometry.spherical.computeDistanceBetween(
            new this.google.maps.LatLng(a.lat, a.lng),
            new this.google.maps.LatLng(b.lat, b.lng)
        );
    }
}
