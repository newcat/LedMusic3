import { Track, Item } from "./model";

export class Editor {

    private _tracks: Track[] = [];
    public get tracks() { return this._tracks as ReadonlyArray<Track>; }

    private _items: Item[] = [];
    public get items() { return this._items as ReadonlyArray<Item>; }

    public addTrack(track: Track, index = -1) {
        if (index >= 0) {
            this._tracks.splice(index, 0, track);
        } else {
            this._tracks.push(track);
        }
    }

    public getTrackById(trackId: string) {
        return this.tracks.find((t) => t.id === trackId);
    }

    public removeTrack(track: Track) {
        const i = this.tracks.indexOf(track);
        if (i >= 0) {
            this._tracks.splice(i, 1);
        }
    }

    public addItem(trackId: string, item: Item) {
        if (this.validateItem()) {
            this._items.push(item);
        }
    }

    public removeItem(item: Item) {
        const i = this.items.indexOf(item);
        if (i >= 0) { this._items.splice(i, 1); }
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
