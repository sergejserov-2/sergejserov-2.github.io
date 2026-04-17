export class Streetview {
    constructor(map) {
        this.map = map; // expected: Google Maps wrapper with polygon + isInMap
    }

    // функция для передачи в Game.js
    async getRandomLocation(endZoom = 14) {
        const tile = await this.randomValidTile(endZoom);
        return this.pickRandomPointFromTile(tile);
    }

    // Поиск большого квадрата
    async randomValidTile(endZoom) {
        let chosenTile = { x: 0, y: 0, zoom: 0 };
        const previousTiles = [];
        const failedTiles = [];

        while (chosenTile.zoom < endZoom) {
            const subTiles = await this.getSubTiles(
                chosenTile.x,
                chosenTile.y,
                chosenTile.zoom
            );

            const validTiles = subTiles
                .filter(t => t.hasSv)
                .filter(t => this.tileIntersectsMap(t))
                .filter(t => !this.isFailed(t, failedTiles));

            if (validTiles.length === 0) {
                failedTiles.push(chosenTile);

                chosenTile =
                    previousTiles.length > 0
                        ? previousTiles.pop()
                        : { x: 0, y: 0, zoom: 0 };

                continue;
            }

            const next = this.pickRandomSubTile(validTiles);
            previousTiles.push(chosenTile);
            chosenTile = next;
        }

        return chosenTile;
    }

    pickRandomSubTile(tiles) {
        const total = tiles.reduce((sum, t) => sum + (t.coverage || 1), 0);
        let r = Math.random() * total;

        for (const tile of tiles) {
            r -= tile.coverage || 1;
            if (r <= 0) return tile;
        }

        return tiles[0];
    }

    // Поиск малого квадрата
    pickRandomPointFromTile(tile) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const img = tile.img;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        const validPixels = [];

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 2] > 0) {
                validPixels.push(i / 4);
            }
        }

        if (validPixels.length === 0) {
            throw new Error("Streetview: no valid pixels found in tile");
        }

        const idx =
            validPixels[Math.floor(Math.random() * validPixels.length)];

        const x = idx % img.width;
        const y = Math.floor(idx / img.width);

        return this.tilePixelToLatLon(
            tile.x,
            tile.y,
            tile.zoom,
            x,
            y
        );
    }

    // MAP INTERSECTION LOGIC
    tileIntersectsMap(tile) {
        const bounds = [
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 0, 0),
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 256, 0),
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 0, 256),
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 256, 256)
        ];

        for (const b of bounds) {
            if (this.map.isInMap(...b)) return true;
        }

        return this.checkPolygonIntersection(bounds);
    }

    checkPolygonIntersection(bounds) {
        let intersect = false;

        this.map.polygon.getPaths().forEach(path => {
            path.forEach(point => {
                if (this.pointInBounds(point, bounds)) {
                    intersect = true;
                }
            });
        });

        return intersect;
    }
    pointInBounds(point, bounds) {
        const rect = new google.maps.LatLngBounds(
            { lat: bounds[0][0], lng: bounds[0][1] },
            { lat: bounds[3][0], lng: bounds[3][1] }
        );

        return rect.contains(point);
    }

    isFailed(tile, failedTiles) {
        return failedTiles.some(
            t =>
                t.x === tile.x &&
                t.y === tile.y &&
                t.zoom === tile.zoom
        );
    }

    // REQUIRED EXTERNAL IMPLEMENTATIONS
    async getSubTiles(x, y, zoom) {
        throw new Error("Streetview: getSubTiles must be implemented externally");
    }

    tilePixelToLatLon(x, y, zoom, px, py) {
        throw new Error("Streetview: tilePixelToLatLon must be implemented externally");
    }
}
