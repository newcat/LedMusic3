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

const defaults = {
    bpm: 130,
    fps: 30,
    volume: 0.5,
    resolution: 128
};

class State implements IState {

    public scene: IScene = { props: [] };
    public library!: LibraryModel;
    public timeline!: LokumEditor;

    public projectFilePath = "";
    public bpm = defaults.bpm;
    public fps = defaults.fps;
    public volume = defaults.volume;
    public position = 0;
    public isPlaying = false;
    public resolution = defaults.resolution;

    public events = {
        initialized: new StandardEvent(),
        positionSetByUser: new StandardEvent()
    };

    constructor() {
        (window as any).globalState = this;
    }

    public initialize() {

        if (this.library) {
            this.library.events.itemRemoved.unsubscribe(this);
        }

        this.library = new LibraryModel();
        this.library.events.itemRemoved.subscribe(this, (item) => {
            const itemsToRemove = this.timeline.items.filter((i) => i.data?.libraryItem === item);
            for (const i of itemsToRemove) {
                this.timeline.removeItem(i);
            }
        });

        this.timeline = new LokumEditor();
        this.events.initialized.emit();
    }

    public reset() {
        this.projectFilePath = "";
        this.bpm = defaults.bpm;
        this.fps = defaults.fps;
        this.volume = defaults.volume;
        this.position = 0;
        this.isPlaying = false;
        this.resolution = defaults.resolution;
        this.initialize();
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
        this.bpm = data.bpm ?? defaults.bpm;
        this.fps = data.fps ?? defaults.fps;
    }

    public setPositionByUser(newPosition: number) {
        this.position = newPosition;
        this.events.positionSetByUser.emit();
    }

}

export const globalState = observable(new State());
