import { observe } from "@nx-js/observer-util";
import { TICKS_PER_BEAT } from "@/constants";
import { Editor, Track } from "./model";
import { LibraryItem, LibraryItemType, AudioFile } from "@/entities/library";
import { globalState } from "@/entities/globalState";

export * from "./model";

export class TimelineEditor extends Editor {
    snapUnits = TICKS_PER_BEAT / 2;

    constructor() {
        super();
        this.addDefaultTrack();
        this.labelFunction = (u) => (u / (TICKS_PER_BEAT * 4)).toString();

        this.events.itemAdded.addListener(this, (i) => {
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

            i.hooks.save.tap(this, (state) => {
                if (state.data && state.data.libraryItem) {
                    const libItem = state.data.libraryItem as LibraryItem;
                    delete state.data.libraryItem;
                    state.data.libraryItemId = libItem.id;
                }
                return state;
            });
        });

        this.events.itemRemoved.addListener(this, (i) => {
            i.hooks.save.untap(this);
        });

        observe(() => {
            this.updateAudioItemLengths();
        });
    }

    public addDefaultTrack() {
        const t = new Track(`Track ${this.tracks.length + 1}`);
        super.addTrack(t);
        return t;
    }

    /** This function is called whenever the BPM is changed */
    private updateAudioItemLengths() {
        const bpm = globalState.bpm;
        this.items.forEach((i) => {
            const libItem = i.data!.libraryItem as LibraryItem;
            if (libItem.type === LibraryItemType.AUDIO_FILE) {
                const af = libItem as AudioFile;
                if (!af.audioBuffer) {
                    return;
                }
                const length = af.audioBuffer.duration * (bpm / 60) * TICKS_PER_BEAT;
                i.move(i.start, i.start + length);
            }
        });
    }
}
