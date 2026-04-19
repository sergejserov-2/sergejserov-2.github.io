export class MapAdapter {
    constructor(google) {
        this.google = google;
    }
    hasStreetView(lat, lng) {
        const sv = new this.google.maps.StreetViewService();

        return new Promise((resolve) => {
            sv.getPanorama(
                {
                    location: { lat, lng },
                    radius: 50
                },
                (data, status) => {
                    resolve(
                        status === this.google.maps.StreetViewStatus.OK
                    );
                }
            );
        });
    }
}
