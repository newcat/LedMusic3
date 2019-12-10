import { Track, Item } from "./model";

export class Editor {

    private _tracks: Track[] = [];
    public get tracks() { return this._tracks as ReadonlyArray<Track>; }

    public addTrack(track: Track, index = -1) {
        if (index >= 0) {
            this._tracks.splice(index, 0, track);
        } else {
            this._tracks.push(track);
        }
    }

    public removeTrack(track: Track) {
        const i = this.tracks.indexOf(track);
        if (i >= 0) {
            this._tracks.splice(i, 1);
        }
    }

    public removeItem(item: Item) {
        const items = this.findTrackByItem(item)?.items;
        if (items) {
            const i = items.indexOf(item);
            if (i >= 0) { items.splice(i, 1); }
        }
    }

    public validateItem(track: Track, item: Item) {
        const isValidItself = item.start < item.end && item.start >= 0 && item.end >= 0;
        return isValidItself && !track.items.some((i) =>
            i.id !== item.id &&
            ((i.start <= item.start && i.end >= item.start) ||
            (i.start <= item.end && i.end >= item.end) ||
            (i.start >= item.start && i.end <= item.end))
        );
    }

    public findTrackByItem(item: Item) {
        return this.tracks.find((t) => t.items.includes(item));
    }

}
