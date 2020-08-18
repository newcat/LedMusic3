import { Application } from "pixi.js";
import { StandardEvent } from "./framework";

export interface IMarker {
    type: "major" | "minor";
    unit: number;
    position: number;
}

export class PositionCalculator {
    public events = {
        moved: new StandardEvent(),
        zoomed: new StandardEvent(),
        markersChanged: new StandardEvent(),
    };

    private _offset = 0;
    private _unitWidth = 1;
    private _markerSpace = 5;
    private _markerMajorMultiplier = 3;
    private _markers: IMarker[] = [];

    public get offset() {
        return this._offset;
    }
    public set offset(v: number) {
        this._offset = v;
        this.events.moved.emit();
        this.calculateMarkers();
    }

    public get unitWidth() {
        return this._unitWidth;
    }
    public set unitWidth(v: number) {
        this._unitWidth = v;
        this.events.moved.emit();
        this.events.zoomed.emit();
        this.calculateMarkers();
    }

    public get markerSpace() {
        return this._markerSpace;
    }
    public set markerSpace(v: number) {
        this._markerSpace = v;
        this.calculateMarkers();
    }

    public get markerMajorMultiplier() {
        return this._markerMajorMultiplier;
    }
    public set markerMajorMultiplier(v: number) {
        this._markerMajorMultiplier = v;
        this.calculateMarkers();
    }

    public get markers() {
        return this._markers;
    }

    constructor(private _$_app: Application) {}

    public getX(units: number) {
        return units * this.unitWidth + this.offset;
    }

    public getUnit(x: number) {
        return Math.floor((x - this.offset) / this.unitWidth);
    }

    private calculateMarkers() {
        if (this.unitWidth <= 0) {
            return;
        }
        const markers: IMarker[] = [];
        let n = 0;
        let unit = 0;
        let x = 0;
        do {
            x = this.getX(unit);
            if (x >= 0 && x < this._$_app.screen.width) {
                if (n % this.markerMajorMultiplier === 0) {
                    markers.push({ type: "major", unit, position: x });
                } else {
                    markers.push({ type: "minor", unit, position: x });
                }
            }
            unit += this.markerSpace;
            n++;
        } while (x < this._$_app.screen.width);
        this._markers = markers;
        this.events.markersChanged.emit();
    }
}
