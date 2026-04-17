export class MapAdapter {
    constructor(map) {
        this.map = map;
    }

    async getSubTiles(x, y, zoom) {
        if (this.map?.getSubTiles) {
            return await this.map.getSubTiles(x, y, zoom);
        }

        if (this.map?.tileSystem?.getSubTiles) {
            return await this.map.tileSystem.getSubTiles(x, y, zoom);
        }

        throw new Error("No getSubTiles in map");
    }

    isInMap(lat, lng) {
        if (typeof this.map?.isInMap === "function") {
            return this.map.isInMap(lat, lng);
        }

        if (this.map?.polygon) {
            return google.maps.geometry.poly.containsLocation(
                { lat, lng },
                this.map.polygon
            );
        }

        return false;
    }

    get polygon() {
        return this.map.polygon;
    }
}
