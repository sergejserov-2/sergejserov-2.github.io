export class Scoring {
    constructor(geometry) {
        this.geometry = geometry;
    }

    distance(from, to) {
        return this.geometry.distance(from, to);
    }


    calculateScore(distance) {
        const max = 5000;
        return Math.max(0, Math.round(max - distance));
    }

    formatDistance(meters) {
        if (meters < 1000) return `${Math.floor(meters)} м`;
        if (meters < 20000) return `${(meters / 1000).toFixed(1)} км`;
        return `${Math.floor(meters / 1000)} км`;
    }


    calculateResult({ guess, actual }) {
        if (!guess || !actual) {
            return { score: 0, distance: 0 };
        }
    
        const distanceMeters =
            google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(guess.lat, guess.lng),
                new google.maps.LatLng(actual.lat, actual.lng)
            );
    
        const distanceKm = distanceMeters / 1000;
    
        // пример нормального скоринга
        const score = Math.max(0, Math.round(5000 - distanceKm));
    
        return {
            distance: Math.round(distanceKm),
            score
        };
    }
}
