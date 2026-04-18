export class MathUtil {

    // GEODESIC DISTANCE (Haversine)
    distance(from, to) {
        const R = 6371000;

        const toRad = (deg) => deg * Math.PI / 180;

        const dLat = toRad(to.lat - from.lat);
        const dLng = toRad(to.lng - from.lng);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(from.lat)) *
            Math.cos(toRad(to.lat)) *
            Math.sin(dLng / 2) ** 2;

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // CLAMP
    clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

    // NORMALIZE (0..1)
    normalize(value, min, max) {
        if (max === min) return 0;
        return (value - min) / (max - min);
    }

    // EASING
    easeOut(value, power = 2) { return 1 - Math.pow(1 - value, power); }

    // GEOMETRY: BOUNDS
    getBounds(polygon) {
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLng = Infinity;
        let maxLng = -Infinity;
        for (const [lat, lng] of polygon) {
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        }
        return { minLat, maxLat, minLng, maxLng };
    }

    // RANDOM POINT IN BOUNDS
    randomPointInBounds(bounds) {
        return {
            lat: bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat),
            lng: bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng)
        };
    }

    // POINT IN POLYGON (RAY CASTING)
    isInsidePolygon(point, polygon) {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const intersect =
                yi > point.lat !== yj > point.lat &&
                point.lng <
                    ((xj - xi) * (point.lat - yi)) / (yj - yi + 1e-9) + xi;

            if (intersect) inside = !inside;
        }
        return inside;
    }
}
