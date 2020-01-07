import { TICKS_PER_BEAT } from "@/constants";
import { Editor, Track } from "@/lokumjs";

export class LokumEditor extends Editor {

    snapUnits = TICKS_PER_BEAT / 2;

    constructor() {
        super();
        this.addTrack();
        this.labelFunction = (u) => (u / (TICKS_PER_BEAT * 4)).toString();
        this.events.itemAdded.subscribe(this, (i) => {
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
        });
        this.events.itemRemoved.subscribe(this, (i) => { i.events.beforeMoved.unsubscribe(this); });
    }

    public addTrack() {
        const t = new Track(`Track ${this.tracks.length + 1}`);
        super.addTrack(t);
        return t;
    }

    public snap(unit: number) {
        const mod = unit % this.snapUnits;
        return mod <= (this.snapUnits / 2) ? unit - mod : unit + this.snapUnits - mod;
    }

}
