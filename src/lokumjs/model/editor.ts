import { Track } from "./track.model";
import { Item } from "./item.model";
import { PreventableEvent, StandardEvent } from "../framework";

export class Editor {

    public events = {
        beforeItemAdded: new PreventableEvent<Item>(),
        itemAdded: new StandardEvent<Item>(),
        beforeItemRemoved: new PreventableEvent<Item>(),
        itemRemoved: new StandardEvent<Item>(),
        beforeTrackAdded: new PreventableEvent<Track>(),
        trackAdded: new StandardEvent<Track>(),
        beforeTrackRemoved: new PreventableEvent<Track>(),
        trackRemoved: new StandardEvent<Track>()
    };

    private _tracks: Track[] = [];
    private _items: Item[] = [];

    public get tracks() { return this._tracks as ReadonlyArray<Track>; }
    public get items() { return this._items as ReadonlyArray<Item>; }

    public addTrack(track: Track, index = -1) {
        if (this.events.beforeTrackAdded.emit(track)) {
            if (index >= 0) {
                this._tracks.splice(index, 0, track);
            } else {
                this._tracks.push(track);
            }
            this.events.trackAdded.emit(track);
        }
    }

    public getTrackById(trackId: string) {
        return this.tracks.find((t) => t.id === trackId);
    }

    public removeTrack(track: Track) {
        if (this.events.beforeTrackRemoved.emit(track)) {
            const i = this.tracks.indexOf(track);
            if (i >= 0) {
                this._tracks.splice(i, 1);
                this.events.trackRemoved.emit(track);
            }
        }
    }

    public addItem(item: Item) {
        if (this.events.beforeItemAdded.emit(item)) {
            if (this.validateItem()) {
                this._items.push(item);
                this.events.itemAdded.emit(item);
            }
        }
    }

    public removeItem(item: Item) {
        if (this.events.beforeItemRemoved.emit(item)) {
            const i = this.items.indexOf(item);
            if (i >= 0) {
                this._items.splice(i, 1);
                this.events.itemRemoved.emit(item);
            }
        }
    }

    public validateItem(/*trackId: string, start: number, item: Item*/) {
        /*const isValidItself = item.start < item.end && item.start >= 0 && item.end >= 0;
        return isValidItself && !this.items.some((i) =>
            i.id !== item.id &&
            i.trackId === trackId &&
            ((i.start <= item.start && i.end >= item.start) ||
            (i.start <= item.end && i.end >= item.end) ||
            (i.start >= item.start && i.end <= item.end))
        );*/
        // TODO: Rework
        return true;
    }

}
