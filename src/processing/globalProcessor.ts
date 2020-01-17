import { AudioProcessor } from "./audioProcessor";
import { TimelineProcessor } from "./timelineProcessor";
import globalState from "@/entities/globalState";
import { StandardEvent } from "@/lokumjs";

class GlobalProcessor {

    public audioProcessor!: AudioProcessor;
    public timelineProcessor!: TimelineProcessor;

    public events = {
        positionChanged: new StandardEvent<number>(),
        tick: new StandardEvent()
    };

    private _position = 0;
    private timer: any = null;

    public get position() { return this._position; }
    public set position(v: number) {
        this._position = v;
        this.audioProcessor.position = v;
        this.events.positionChanged.emit(v);
    }

    public get isPlaying() { return this.audioProcessor.isPlaying; }

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
        this.audioProcessor.play();
    }

    public pause() {
        this.audioProcessor.pause();
    }

    private setTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.timer = setInterval(() => this.tick(), 1000 / globalState.fps);
    }

    private tick() {
        this.audioProcessor.updatePosition();
        const oldPosition = this._position;
        this._position = this.audioProcessor.position;
        if (oldPosition !== this._position) {
            this.events.positionChanged.emit(this.position);
        }
        this.timelineProcessor.process(this.position);
        this.events.tick.emit();
    }

}

export const globalProcessor = new GlobalProcessor();
