import { observe } from "@nx-js/observer-util";
import { TICKS_PER_BEAT } from "@/constants";
import { Editor, Track } from "./model";
import type { AudioLibraryItem } from "@/audio";
import { LibraryItemType } from "@/library";
import { globalState } from "@/globalState";

export * from "./model";
export * from "./timelineProcessor";

export class TimelineEditor extends Editor {
    snapUnits = TICKS_PER_BEAT / 2;

    constructor() {
        super();
        this.addDefaultTrack();
        this.labelFunction = (u) => (u / (TICKS_PER_BEAT * 4)).toString();
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
