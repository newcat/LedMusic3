import { observe } from "@nx-js/observer-util";
import { AudioProcessor } from "./audioProcessor";
import { TimelineProcessor } from "./timelineProcessor";
import { globalState } from "@/entities/globalState";
import { StandardEvent } from "@/lokumjs";

class GlobalProcessor {

    public audioProcessor!: AudioProcessor;
    public timelineProcessor!: TimelineProcessor;

    public events = {
        tick: new StandardEvent()
    };

    private timer: any = null;

    public constructor() {
        (window as any).globalProcessor = this;
    }

    public initialize() {
        this.audioProcessor = new AudioProcessor();
        this.timelineProcessor = new TimelineProcessor(this.audioProcessor, globalState.timeline);
        observe(() => this.setTimer());
    }

    public play() {
        this.audioProcessor.play();
        globalState.isPlaying = true;
    }

    public pause() {
        this.audioProcessor.pause();
        globalState.isPlaying = false;
    }

    private setTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => this.tick(), 1000 / globalState.fps);
    }

    private tick() {
        if (!globalState.isPlaying) { return; }
        this.audioProcessor.updatePosition();
        this.timelineProcessor.process(globalState.position);
        this.events.tick.emit();
    }

}

export const globalProcessor = new GlobalProcessor();
