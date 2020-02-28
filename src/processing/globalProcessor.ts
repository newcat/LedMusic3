import { AudioProcessor } from "./audioProcessor";
import { TimelineProcessor } from "./timelineProcessor";
import globalState from "@/entities/globalState";
import { StandardEvent } from "@/lokumjs";

class GlobalProcessor {

    public audioProcessor!: AudioProcessor;
    public timelineProcessor!: TimelineProcessor;

    public paused = true;

    public events = {
        positionChanged: new StandardEvent<number>(),
        tick: new StandardEvent()
    };

    private timer: any = null;

    public constructor() {
        (window as any).globalProcessor = this;
    }

    public initialize() {
        this.audioProcessor = new AudioProcessor();
        this.timelineProcessor = new TimelineProcessor(this.audioProcessor, globalState.timeline);
        globalState.events.fpsChanged.subscribe(this, () => this.setTimer());
        this.setTimer();
    }

    public play() {
        this.paused = false;
        this.audioProcessor.play();
    }

    public pause() {
        this.paused = true;
        this.audioProcessor.pause();
    }

    private setTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => this.tick(), 1000 / globalState.fps);
    }

    private tick() {
        if (this.paused) { return; }
        this.audioProcessor.updatePosition();
        this.timelineProcessor.process(globalState.position);
        this.events.tick.emit();
    }

}

export const globalProcessor = new GlobalProcessor();
