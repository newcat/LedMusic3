import { Application } from "pixi.js";
import { StandardEvent } from "./framework";

export interface IMarker {
    type: "major"|"minor";
    unit: number;
    position: number;
}

export class PositionCalculator {

    public events = {
        moved: new StandardEvent(),
        markersChanged: new StandardEvent()
    };

    private _offset = 0;
    private _unitWidth = 0;
    private _markerSpace = 5;
    private _markerMajorMultiplier = 3;
    private _markers: IMarker[] = [];

    public get offset() { return this._offset; }
    public set offset(v: number) {
        this._offset = v;
        this.events.moved.emit();
        this.calculateMarkers();
    }

    public get unitWidth() { return this._unitWidth; }
    public set unit

    public get markers() {
        return this._markers;
    }

    constructor(private _$_app: Application) { }

    public getX(units: number) {
        return units * this.unitWidth + this.offset;
    }

    public getUnit(x: number) {
        return Math.floor((x - this.offset) / this.unitWidth);
    }

    private calculateMarkers() {
        const markers: IMarker[] = [];
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
        this._markers = markers;
        this.events.markersChanged.emit();
    }

}
