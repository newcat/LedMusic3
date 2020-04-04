import { observe } from "@nx-js/observer-util";
import { AudioProcessor } from "./audioProcessor";
import { TimelineProcessor } from "./timelineProcessor";
import { globalState } from "@/entities/globalState";
import { StandardEvent } from "@/lokumjs";
import { Color } from "@/editors/graph/colors";
import { Socket, createSocket } from "dgram";

class GlobalProcessor {

    public audioProcessor!: AudioProcessor;
    public timelineProcessor!: TimelineProcessor;

    public globalPreview: Color[] = [];

    public events = {
        tick: new StandardEvent(),
        globalPreviewUpdated: new StandardEvent()
    };

    private timer: any = null;
    private socket?: Socket;
    private sendTo = -1;

    public constructor() {
        (window as any).globalProcessor = this;
        globalState.events.initialized.subscribe(this, () => this.initialize());
        this.socket = createSocket("udp4");
        this.socket.on("message", (msg, info) => {
            this.sendTo = info.port;
        });
        this.socket.bind(41234);
    }

    public initialize() {
        if (this.audioProcessor) { this.audioProcessor.destroy(); }
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
        if (this.socket && this.sendTo > 0) {
            const arr = new Uint8Array(this.globalPreview.length * 3 + 1);
            arr[0] = this.globalPreview.length;
            for (let i = 0; i < this.globalPreview.length; i++) {
                arr[3 * i + 1] = this.globalPreview[i][0];
                arr[3 * i + 2] = this.globalPreview[i][1];
                arr[3 * i + 3] = this.globalPreview[i][2];
            }
            this.socket.send(arr, this.sendTo);
        }
    }

}

export const globalProcessor = new GlobalProcessor();
