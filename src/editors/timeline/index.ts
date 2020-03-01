import { observe } from "@nx-js/observer-util";
import { TICKS_PER_BEAT } from "@/constants";
import { Editor, Track } from "@/lokumjs";
import { ILibraryItem, LibraryItemType, AudioFile } from "@/entities/library";
import { globalState } from "@/entities/globalState";

export class LokumEditor extends Editor {

    snapUnits = TICKS_PER_BEAT / 2;
    ignoreSnap = false;

    constructor() {
        super();
        this.addDefaultTrack();
        this.labelFunction = (u) => (u / (TICKS_PER_BEAT * 4)).toString();

        this.events.itemAdded.subscribe(this, (i) => {

            if (i.data && i.data.libraryItemId) {
                const libItem = globalState.library.getItemById(i.data.libraryItemId);
                if (libItem) {
                    i.data.libraryItem = libItem;
                    delete i.data.libraryItemId;
                } else {
                    // tslint:disable-next-line: no-console
                    console.warn(`[Timeline] Could not find library item with id ${i.data.libraryItemId}`);
                }
            }

            i.events.beforeMoved.subscribe(this, (newPos) => {
                const startChanged = newPos.start !== i.start;
                const endChanged = newPos.end !== i.end;
                if (startChanged && endChanged) {
                    // item was moved, not resized. Make sure, the overall length stays the same
                    const snappedStart = this.snap(newPos.start);
                    if (snappedStart !== newPos.start) {
                        i.move(snappedStart, snappedStart + (newPos.end - newPos.start));
                        return false;
                    }
                } else if (startChanged) {
                    const snappedStart = this.snap(newPos.start);
                    if (snappedStart !== newPos.start) {
                        i.move(snappedStart, newPos.end);
                        return false;
                    }
                } else if (endChanged) {
                    const snappedEnd = this.snap(newPos.end);
                    if (snappedEnd !== newPos.end) {
                        i.move(newPos.start, snappedEnd);
                        return false;
                    }
                }
            });

            i.hooks.save.tap(this, (state) => {
                if (state.data && state.data.libraryItem) {
                    const libItem = state.data.libraryItem as ILibraryItem;
                    delete state.data.libraryItem;
                    state.data.libraryItemId = libItem.id;
                }
                return state;
            });

        });

        this.events.itemRemoved.subscribe(this, (i) => {
            i.events.beforeMoved.unsubscribe(this);
            i.hooks.save.untap(this);
        });

        observe(() => { this.updateAudioItemLengths(); });

    }

    public addDefaultTrack() {
        const t = new Track(`Track ${this.tracks.length + 1}`);
        super.addTrack(t);
        return t;
    }

    public snap(unit: number) {
        if (this.ignoreSnap) { return unit; }
        const mod = unit % this.snapUnits;
        return mod <= (this.snapUnits / 2) ? unit - mod : unit + this.snapUnits - mod;
    }

    /** This function is called whenever the BPM is changed */
    private updateAudioItemLengths() {
        const bpm = globalState.bpm;
        this.ignoreSnap = true;
        this.items.forEach((i) => {
            const libItem = i.data!.libraryItem as ILibraryItem;
            if (libItem.type === LibraryItemType.AUDIO_FILE) {
                const af = libItem as AudioFile;
                if (!af.audioBuffer) { return; }
                const length = af.audioBuffer.duration * (bpm / 60) * TICKS_PER_BEAT;
                i.move(i.start, i.start + length);
            }
        });
        this.ignoreSnap = false;
    }

}
