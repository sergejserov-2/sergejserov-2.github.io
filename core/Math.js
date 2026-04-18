export class Math {
    
    distance(from, to) {
        return google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(from.lat, from.lng),
            new google.maps.LatLng(to.lat, to.lng)
        );
    }

    formatDistance(meters) {
        if (meters < 1000) return `${Math.floor(meters)} м`;
        if (meters < 20000) return `${Math.floor(meters / 100) / 10} км`;
        return `${Math.floor(meters / 1000)} км`;
    }

    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    calculateResult({ guess, actual, time }) {
        if (!guess || !actual) {
            return { score: 0, distance: 0 };
        }

        const distance = this.distance(guess, actual);
        const score = this.calculateScore(distance);

        return {
            distance,
            formatted: this.formatDistance(distance),
            score
        };
    }
}
