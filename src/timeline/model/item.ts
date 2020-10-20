import { v4 as uuidv4 } from "uuid";
import { PreventableBaklavaEvent, BaklavaEvent } from "@baklavajs/events";
import { LibraryItem, LibraryModel } from "@/library";

export interface IItemState {
    id: string;
    start: number;
    end: number;
    trackId: string;
    resizable: boolean;
    libraryItemId: string;
}

export class Item {
    public static load(state: IItemState, library: LibraryModel): Item {
        const libraryItem = library.getItemById(state.libraryItemId || (state as any).data?.libraryItemId)!;
        const i = new Item(libraryItem, state.trackId, state.start, state.end);
        i.id = state.id;
        i.resizable = state.resizable;
        return i;
    }

    public id = uuidv4();
    public trackId: string;
    public selected = false;
    public resizable = true;
    public temporary = false;
    public libraryItem: LibraryItem;

    public events = {
        beforeMoved: new PreventableBaklavaEvent<{ start: number; end: number }>(),
        moved: new BaklavaEvent<{ start: number; end: number }>(),
    };

    private _start: number;
    private _end: number;

    public get start() {
        return this._start;
    }
    public get end() {
        return this._end;
    }

    public constructor(libraryItem: LibraryItem, trackId: string, start: number, end: number) {
        this.libraryItem = libraryItem;
        this.trackId = trackId;
        this._start = start;
        this._end = end;
    }

    public move(start: number, end: number) {
        if (!this.events.beforeMoved.emit({ start, end })) {
            this._start = start;
            this._end = end;
            this.events.moved.emit({ start, end });
        }
    }

    public save(): IItemState {
        return {
            id: this.id,
            start: this.start,
            end: this.end,
            trackId: this.trackId,
            resizable: this.resizable,
            libraryItemId: this.libraryItem.id,
        };
    }
}
