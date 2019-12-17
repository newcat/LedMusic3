import uuidv4 from "uuid/v4";
import { PreventableEvent, StandardEvent } from "../framework";

export class Track {

    public readonly id = uuidv4();
    public data?: Record<string, any>;

    public events = {
        beforeNameChanged: new PreventableEvent<string>(),
        nameChanged: new StandardEvent<string>(),
        beforeHeightChanged: new PreventableEvent<number>(),
        heightChanged: new StandardEvent<number>(),
        beforeRemovableChanged: new PreventableEvent<boolean>(),
        removableChanged: new StandardEvent<boolean>()
    };

    public _name: string;
    public _height = 100;
    public _removable = true;

    public get name() { return this._name; }
    public set name(v: string) {
        if (this.events.beforeNameChanged.emit(v)) {
            this._name = v;
            this.events.nameChanged.emit(v);
        }
    }

    public get height() { return this._height; }
    public set height(v: number) {
        if (this.events.beforeHeightChanged.emit(v)) {
            this._height = v;
            this.events.heightChanged.emit(v);
        }
    }

    public get removable() { return this._removable; }
    public set removable(v: boolean) {
        if (this.events.beforeRemovableChanged.emit(v)) {
            this._removable = v;
            this.events.removableChanged.emit(v);
        }
    }

    public constructor(name: string, data?: Record<string, any>) {
        this._name = name;
        this.data = data;
    }

}
