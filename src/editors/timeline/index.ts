import { TICKS_PER_BEAT } from "@/constants";
import { Editor, Track } from "@/lokumjs";

export class LokumEditor extends Editor {

    constructor() {
        super();
        this.addTrack();
        this.labelFunction = (u) => (u / (TICKS_PER_BEAT * 4)).toString();
    }

    public addTrack() {
        const t = new Track(`Track ${this.tracks.length + 1}`);
        super.addTrack(t);
        return t;
    }

}
