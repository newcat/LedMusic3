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
        fpsChanged: new StandardEvent<number>()
    };

    private $bpm = 130;
    private $fps = 30;

    public get bpm() { return this.$bpm; }
    public set bpm(v: number) { this.$bpm = v; this.events.bpmChanged.emit(v); }

    public get fps() { return this.$fps; }
    public set fps(v: number) { this.$fps = v; this.events.fpsChanged.emit(v); }

    public initialize() {
        this.library = new LibraryModel();
        this.timeline = new LokumEditor();
    }

    public save(): Buffer {
        return serialize({
            scene: this.scene,
            timeline: this.timeline.save(),
            library: this.library.save(),
            bpm: this.bpm
        });
    }

    public load(serialized: Buffer) {
        const data = deserialize(serialized);
        this.scene = data.scene;
        this.library.load(data.library);
        this.timeline.load(data.timeline);
        this.bpm = data.bpm;
    }

}

export default new State();
