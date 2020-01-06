import { AudioProcessor } from "./audioProcessor";
import { TimelineProcessor } from "./timelineProcessor";
import globalState from "@/entities/globalState";
import { StandardEvent } from "@/lokumjs";

class GlobalProcessor {

    public audioProcessor: AudioProcessor;
    public timelineProcessor: TimelineProcessor;

    public events = {
        positionChanged: new StandardEvent<number>(),
        tick: new StandardEvent()
    };

    private _position = 0;

    public get position() { return this._position; }
    public set position(v: number) {
        this._position = v;
        this.audioProcessor.position = v;
        this.events.positionChanged.emit(v);
    }

    public get isPlaying() { return this.audioProcessor.isPlaying; }

    public constructor() {
        this.audioProcessor = new AudioProcessor();
        this.timelineProcessor = new TimelineProcessor(this.audioProcessor, globalState.timeline);
        setInterval(() => this.tick(), 1000 / 30);
        (window as any).globalProcessor = this;
    }

    public play() {
        this.audioProcessor.play();
    }

    public pause() {
        this.audioProcessor.pause();
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
