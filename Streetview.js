export class Streetview {
    constructor(map) {
        this.map = map;
        this.distributionExample = { weighted: 0, uniform: 1 };
        this.distribution = this.distributionExample.weighted;
    }

    async randomValidLocation(endZoom = 14) {
        let tile = await this.randomValidTile(endZoom);
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");
        let img = tile.img;
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);
        let data = context.getImageData(0, 0, img.width, img.height).data;
        let bluePixelCount = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 2] > 0) bluePixelCount++;
        }
        let randomPixel = Math.floor(Math.random() * bluePixelCount);
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 2] > 0 && --randomPixel === 0) {
                let x = (i / 4) % img.width;
                let y = Math.floor((i / 4) / img.width);
                return this.tilePixelToLatLon(tile.x, tile.y, tile.zoom, x, y);
            }
        }
        console.error("No blue pixel found");
        return this.randomValidLocation(endZoom);
    }

    async randomValidTile(endZoom) {
        let chosenTile = { x: 0, y: 0, zoom: 0 };
        let previousTiles = [chosenTile];
        let failedTiles = [];
        while (chosenTile.zoom < endZoom) {
            let subTiles = await this.getSubTiles(
                chosenTile.x,
                chosenTile.y,
                chosenTile.zoom
            );
            let validTiles = subTiles
                .filter(tile => tile.hasSv)
                .filter(tile => this.tileIntersectsMap(tile.x, tile.y, tile.zoom))
                .filter(tile => {
                    for (let fail of failedTiles) {
                        if (
                            fail.x === tile.x &&
                            fail.y === tile.y &&
                            fail.zoom === tile.zoom
                        ) {
                            return false;
                        }
                    }
                    return true;
                });
            if (validTiles.length === 0) {
                failedTiles.push(chosenTile);
                if (previousTiles.length > 0)
                    chosenTile = previousTiles.splice(-2)[0];
                else
                    chosenTile = { x: 0, y: 0, zoom: 0 };
                console.log(
                    "Позиция не найдена, поиск..." +
                        chosenTile.zoom,
                    chosenTile
                );
            } else {
                chosenTile = this.pickRandomSubTile(validTiles);
                previousTiles.push(chosenTile);
            }
        }
        return chosenTile;
    }

    pickRandomSubTile(tiles) {
        if (this.distribution === this.distributionExample.uniform) {
            return tiles[Math.floor(Math.random() * tiles.length)];
        }
        let totalCoverage = tiles
            .map(tile => tile.coverage)
            .reduce((a, b) => a + b, 0);
        let random = Math.random() * totalCoverage;
        for (let tile of tiles) {
            random -= tile.coverage;
            if (random <= 0) return tile;
        }
        console.error("Не найти плитку");
    }

    tileIntersectsMap(tileX, tileY, zoom) {
        let bounds = [];
        bounds.push(
            this.tilePixelToLatLon(tileX, tileY, zoom, 0, 0)
        );
        bounds.push(
            this.tilePixelToLatLon(tileX, tileY, zoom, 256, 256)
        );
        bounds.push(
            this.tilePixelToLatLon(tileX, tileY, zoom, 0, 256)
        );
        bounds.push(
            this.tilePixelToLatLon(tileX, tileY, zoom, 256, 0)
        );
        for (let bound of bounds) {
            if (this.map.isInMap(bound.lat, bound.lng)) {
                return true;
            }
        }
        let mapsBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(bounds[2].lat, bounds[2].lng),
            new google.maps.LatLng(bounds[3].lat, bounds[3].lng)
        );

        let intersect = false;
        this.map.polygon.getPaths().forEach(path => {
            path.forEach(point => {
                if (mapsBounds.contains(point)) {
                    intersect = true;
                }
            });
        });
        return intersect;
    }
}
