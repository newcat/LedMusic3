import { serialize, deserialize } from "bson";
import { LokumEditor } from "@/editors/timeline";
import { LibraryModel } from "./library/libraryModel";
import { StandardEvent } from "@/lokumjs";

interface IProp {
    type: string;
    x: number;
    y: number;
    angle: number;
}

interface IScene {
    props: IProp[];
}

export interface IState {
    scene: IScene;
    library: LibraryModel;
    timeline: LokumEditor;
    bpm: number;
    fps: number;
}

class State implements IState {

    public scene: IScene = { props: [] };
    public library!: LibraryModel;
    public timeline!: LokumEditor;

    public events = {
        bpmChanged: new StandardEvent<number>(),
        fpsChanged: new StandardEvent<number>(),
        volumeChanged: new StandardEvent<number>(),
        positionChanged: new StandardEvent<number>(),
        isPlayingChanged: new StandardEvent<boolean>()
    };

    private $bpm = 130;
    private $fps = 30;
    private $volume = 0.5;
    private $position = 0;
    private $isPlaying = false;

    public get bpm() { return this.$bpm; }
    public set bpm(v: number) { this.$bpm = v; this.events.bpmChanged.emit(v); }

    public get fps() { return this.$fps; }
    public set fps(v: number) { this.$fps = v; this.events.fpsChanged.emit(v); }

    public get volume() { return this.$volume; }
    public set volume(v: number) { this.$volume = v; this.events.volumeChanged.emit(v); }

    public get position() { return this.$position; }
    public set position(v: number) { this.$position = v; this.events.positionChanged.emit(v); }

    public get isPlaying() { return this.$isPlaying; }
    public set isPlaying(v: boolean) { this.$isPlaying = v; this.events.isPlayingChanged.emit(v); }

    constructor() {
        (window as any).globalState = this;
    }

    public initialize() {
        this.library = new LibraryModel();
        this.timeline = new LokumEditor();
    }

    public save(): Buffer {
        return serialize({
            scene: this.scene,
            timeline: this.timeline.save(),
            library: this.library.save(),
            bpm: this.bpm,
            fps: this.fps
        });
    }

    public load(serialized: Buffer) {
        const data = deserialize(serialized);
        this.scene = data.scene;
        this.library.load(data.library);
        this.timeline.load(data.timeline);
        this.bpm = data.bpm;
        this.fps = data.fps;
    }

}

export default new State();
