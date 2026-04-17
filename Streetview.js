export class Streetview {
    constructor(mapAdapter) {
        this.map = mapAdapter;

        this.distributionExample = {
            weighted: 0,
            uniform: 1
        };

        this.distribution = this.distributionExample.weighted;
    }

    async getRandomLocation(endZoom = 14) {
        const tile = await this.randomValidTile(endZoom);
        return this.pickRandomPixel(tile);
    }

    async randomValidTile(endZoom) {
        let chosenTile = { x: 0, y: 0, zoom: 0 };
        let previousTiles = [chosenTile];
        let failedTiles = [];

        while (chosenTile.zoom < endZoom) {
            const subTiles = await this.map.getSubTiles(
                chosenTile.x,
                chosenTile.y,
                chosenTile.zoom
            );

            const validTiles = subTiles
                .filter(t => t.hasSv)
                .filter(t => this.tileIntersectsMap(t));

            if (validTiles.length === 0) {
                failedTiles.push(chosenTile);

                chosenTile =
                    previousTiles.length > 0
                        ? previousTiles.splice(-2)[0]
                        : { x: 0, y: 0, zoom: 0 };
            } else {
                chosenTile = this.pickRandomSubTile(validTiles);
                previousTiles.push(chosenTile);
            }
        }

        return chosenTile;
    }

    tileIntersectsMap(tile) {
        const bounds = [
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 0, 0),
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 256, 256),
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 0, 256),
            this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, 256, 0),
        ];

        for (const b of bounds) {
            if (this.map.isInMap(b.lat, b.lng)) {
                return true;
            }
        }

        if (this.map.polygon) {
            const rect = new google.maps.LatLngBounds(
                new google.maps.LatLng(bounds[2].lat, bounds[2].lng),
                new google.maps.LatLng(bounds[3].lat, bounds[3].lng)
            );

            let intersect = false;

            this.map.polygon.getPaths().forEach(path => {
                path.forEach(p => {
                    if (rect.contains(p)) intersect = true;
                });
            });

            return intersect;
        }

        return false;
    }

    pickRandomPixel(tile) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const img = tile.img;

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, img.width, img.height).data;

        let bluePixelCount = 0;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 2] > 0) bluePixelCount++;
        }

        let randomPixel = Math.floor(Math.random() * bluePixelCount);

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 2] > 0 && --randomPixel === 0) {
                const x = (i / 4) % img.width;
                const y = Math.floor((i / 4) / img.width);

                return this.tilePixelToLatLon(
                    tile.x,
                    tile.y,
                    tile.zoom,
                    x,
                    y
                );
            }
        }

        throw new Error("No valid pixel found");
    }
}
