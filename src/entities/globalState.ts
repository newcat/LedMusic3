import { observable } from "@nx-js/observer-util";
import { serialize, deserialize } from "bson";
import { LokumEditor } from "@/editors/timeline";
import { LibraryModel } from "./library/libraryModel";

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
    public library = new LibraryModel();
    public timeline = new LokumEditor();
    public bpm = 130;
    public fps = 30;

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

export default observable(new State());
