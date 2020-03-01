import { serialize, deserialize } from "bson";
import { observable } from "@nx-js/observer-util";
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

    public bpm = 130;
    public fps = 30;
    public volume = 0.5;
    public position = 0;
    public isPlaying = false;
    public resolution = 128;

    public events = {
        positionSetByUser: new StandardEvent()
    };

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

    public setPositionByUser(newPosition: number) {
        this.position = newPosition;
        this.events.positionSetByUser.emit();
    }

}

export const globalState = observable(new State());
