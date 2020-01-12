import uuidv4 from "uuid/v4";
import { PreventableEvent, StandardEvent, SequentialHook } from "../framework";

export interface IItemState {
    id: string;
    start: number;
    end: number;
    trackId: string;
    resizable: boolean;
    data?: Record<string, any>;
}

export class Item {

    public static load(state: IItemState): Item {
        const i = new Item(state.trackId, state.start, state.end, state.data);
        (i as any).id = state.id;
        i.resizable = state.resizable;
        return i;
    }

    public readonly id = uuidv4();
    public data?: Record<string, any>;

    public events = {
        beforeMoved: new PreventableEvent<{ start: number, end: number }>(),
        moved: new StandardEvent<{ start: number, end: number }>(),
        beforeSelectedChanged: new PreventableEvent<boolean>(),
        selectedChanged: new StandardEvent<boolean>(),
        beforeTrackChanged: new PreventableEvent<string>(),
        trackChanged: new StandardEvent<string>(),
        beforeResizableChanged: new PreventableEvent<boolean>(),
        resizableChanged: new StandardEvent<boolean>(),
        beforeTemporaryChanged: new PreventableEvent<boolean>(),
        temporaryChanged: new StandardEvent<boolean>()
    };

    public hooks = {
        save: new SequentialHook<IItemState>()
    };

    private _start: number;
    private _end: number;
    private _trackId: string;
    private _selected = false;
    private _resizable = true;
    private _temporary = false;

    public get start() { return this._start; }
    public get end() { return this._end; }

    public get trackId() { return this._trackId; }
    public set trackId(v: string) {
        if (this.events.beforeTrackChanged.emit(v)) {
            this._trackId = v;
            this.events.trackChanged.emit(v);
        }
    }

    public get selected() { return this._selected; }
    public set selected(v: boolean) {
        if (this.events.beforeSelectedChanged.emit(v)) {
            this._selected = v;
            this.events.selectedChanged.emit(v);
        }
    }

    public get resizable() { return this._resizable; }
    public set resizable(v: boolean) {
        if (this.events.beforeResizableChanged.emit(v)) {
            this._resizable = v;
            this.events.resizableChanged.emit(v);
        }
    }

    public get temporary() { return this._temporary; }
    public set temporary(v: boolean) {
        if (this.events.beforeTemporaryChanged.emit(v)) {
            this._temporary = v;
            this.events.temporaryChanged.emit(v);
        }
    }

    public constructor(trackId: string, start: number, end: number, data?: Record<string, any>) {
        this._trackId = trackId;
        this._start = start;
        this._end = end;
        this.data = data;
    }

    public move(start: number, end: number) {
        if (this.events.beforeMoved.emit({ start, end })) {
            this._start = start;
            this._end = end;
            this.events.moved.emit({ start, end });
        }
    }

    public save(): IItemState {
        return this.hooks.save.execute({
            id: this.id,
            start: this.start,
            end: this.end,
            trackId: this.trackId,
            resizable: this.resizable,
            data: this.data
        });
    }

}
