import { Application } from "pixi.js";

export class PositionCalculator {

    public offset = 0;
    public unitWidth = 10;

    public markerSpace = 5;
    public markerMajorMultiplier = 3;

    public get markers() {
        const markers = [];
        let n = 0;
        let x = 0;
        do {
            x = this.getX(n);
            if (x >= 0 && x < this._$_app.screen.width) {
                if (n % this.markerMajorMultiplier === 0) {
                    markers.push({ type: "major", unit: n, position: x });
                } else {
                    markers.push({ type: "minor", unit: n, position: x });
                }
            }
            n += this.markerSpace;
        } while (x < this._$_app.screen.width);
        return markers;
    }

    constructor(private _$_app: Application) { }

    public getX(units: number) {
        return units * this.unitWidth + this.offset;
    }

    public getUnit(x: number) {
        return Math.floor((x - this.offset) / this.unitWidth);
    }

}
