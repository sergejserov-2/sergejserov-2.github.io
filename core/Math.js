export class Math {

    // расстояние между двумя точками (в метрах)
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

    // ограничение значения в диапазоне
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    // нормализация значения в диапазон 0..1
    normalize(value, min, max) {
        if (max === min) return 0;
        return (value - min) / (max - min);
    }

    // экспоненциальное сглаживание (для кривых)
    easeOut(value, power = 2) {
        return 1 - Math.pow(1 - value, power);
    }
}
