import { Track, ITrackState } from "./track";
import { Item, IItemState } from "./item";
import { BaklavaEvent, PreventableBaklavaEvent } from "@baklavajs/events";
import { LibraryItemType, LibraryModel } from "@/library";
import Vue from "vue";
import { globalState } from "@/globalState";
import { AudioLibraryItem } from "@/audio";
import { TICKS_PER_BEAT } from "@/constants";
import { observe } from "@nx-js/observer-util";

export interface IEditorState {
    tracks: ITrackState[];
    items: IItemState[];
    unitWidth: number;
    headerWidth: number;
}

export class TimelineEditor {
    public events = {
        beforeItemAdded: new PreventableBaklavaEvent<Item>(),
        itemAdded: new BaklavaEvent<Item>(),
        beforeItemRemoved: new PreventableBaklavaEvent<Item>(),
        itemRemoved: new BaklavaEvent<Item>(),
        beforeTrackAdded: new PreventableBaklavaEvent<Track>(),
        trackAdded: new BaklavaEvent<Track>(),
        beforeTrackRemoved: new PreventableBaklavaEvent<Track>(),
        trackRemoved: new BaklavaEvent<Track>(),
    };

    private _tracks: Track[] = [];
    private _items: Item[] = [];

    public unitWidth = 1.5;
    public headerWidth = 200;

    public labelFunction: (unit: number) => string = (u) => u.toString();

    public get tracks() {
        return this._tracks as ReadonlyArray<Track>;
    }
    public get items() {
        return this._items as ReadonlyArray<Item>;
    }

    public constructor() {
        this.addDefaultTrack();
        this.labelFunction = (u) => (u / (TICKS_PER_BEAT * 4)).toString();
        observe(() => {
            this.updateAudioItemLengths();
        });
    }

    public load(state: IEditorState, library: LibraryModel) {
        this.items.forEach((i) => this.removeItem(i));
        this.tracks.forEach((t) => this.removeTrack(t));
        for (const ts of state.tracks) {
            const t = Track.load(ts);
            this.addTrack(t);
        }
        // state.tracks.forEach((ts) => this.addTrack(Track.load(ts)));
        state.items.forEach((is) => this.addItem(Item.load(is, library)));
        this.unitWidth = state.unitWidth ?? 1.5;
        this.headerWidth = state.headerWidth ?? 200;
    }

    public save(): IEditorState {
        return {
            tracks: this.tracks.map((t) => t.save()),
            items: this.items.map((i) => i.save()),
            unitWidth: this.unitWidth,
            headerWidth: this.headerWidth,
        };
    }

    public addTrack(track: Track, index = -1) {
        if (!this.events.beforeTrackAdded.emit(track)) {
            if (index >= 0) {
                this._tracks.splice(index, 0, track);
            } else {
                this._tracks.push(track);
            }
            this.events.trackAdded.emit(track);
        }
    }

    public addDefaultTrack() {
        const t = new Track(`Track ${this.tracks.length + 1}`);
        this.addTrack(t);
        return t;
    }

    public getTrackById(trackId: string) {
        return this.tracks.find((t) => t.id === trackId);
    }

    public removeTrack(track: Track) {
        if (!this.events.beforeTrackRemoved.emit(track)) {
            const i = this.tracks.indexOf(track);
            if (i >= 0) {
                this._tracks.splice(i, 1);
                this.events.trackRemoved.emit(track);
            }
        }
    }

    public moveTrack(track: Track, direction: "up" | "down") {
        const i = this.tracks.indexOf(track);
        const other = direction === "up" ? i - 1 : i + 1;
        if (i < 0 || i >= this.tracks.length || other < 0 || other >= this.tracks.length) {
            return;
        }
        const temp = this.tracks[i];
        Vue.set(this._tracks, i, this.tracks[other]);
        Vue.set(this._tracks, other, temp);
    }

    public addItem(item: Item) {
        if (!this.events.beforeItemAdded.emit(item)) {
            if (this.validateItem()) {
                this._items.push(item);
                this.events.itemAdded.emit(item);
            }
        }
    }

    public removeItem(item: Item) {
        if (!this.events.beforeItemRemoved.emit(item)) {
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

    /** This function is called whenever the BPM is changed */
    private updateAudioItemLengths() {
        const bpm = globalState.bpm;
        this.items.forEach((i) => {
            if (i.libraryItem.type === LibraryItemType.AUDIO) {
                const af = i.libraryItem as AudioLibraryItem;
                if (!af.audioBuffer) {
                    return;
                }
                const length = af.audioBuffer.duration * (bpm / 60) * TICKS_PER_BEAT;
                i.move(i.start, i.start + length);
            }
        });
    }
}
