import { AreaRules } from "./AreaRules.js";

export class Area {

    constructor() {
        this.areas = this.createAreas();
    }

    createAreas() {
        return [
            {
                id: "area_1",
                name: "Central Zone",
                polygonPoints: [
                    { lat: 54.9, lng: 23.9 },
                    { lat: 54.91, lng: 23.95 },
                    { lat: 54.89, lng: 23.96 },
                    { lat: 54.88, lng: 23.92 }
                ],
                minimumDistanceForPoints: 5000,
                rules: new AreaRules(
                    [
                        { lat: 54.9, lng: 23.9 },
                        { lat: 54.91, lng: 23.95 },
                        { lat: 54.89, lng: 23.96 },
                        { lat: 54.88, lng: 23.92 }
                    ],
                    5000,
                    "Central Zone"
                )
            },

            {
                id: "area_2",
                name: "Industrial Zone",
                polygonPoints: [
                    { lat: 54.92, lng: 23.85 },
                    { lat: 54.93, lng: 23.9 },
                    { lat: 54.91, lng: 23.91 },
                    { lat: 54.90, lng: 23.86 }
                ],
                minimumDistanceForPoints: 8000,
                rules: new AreaRules(
                    [
                        { lat: 54.92, lng: 23.85 },
                        { lat: 54.93, lng: 23.9 },
                        { lat: 54.91, lng: 23.91 },
                        { lat: 54.90, lng: 23.86 }
                    ],
                    8000,
                    "Industrial Zone"
                )
            }
        ];
    }

    // вернуть все Area
    getAll() {
        return this.areas;
    }

    // получить по id
    getById(id) {
        return this.areas.find(area => area.id === id);
    }
}
