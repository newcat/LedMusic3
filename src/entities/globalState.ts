import { ILibraryItem } from "./library/libraryItem";
import { LokumEditor } from "@/editors/timeline";

interface IProp {
    type: string;
    x: number;
    y: number;
    angle: number;
}

interface IScene {
    props: IProp[];
}

interface IState {
    scene: IScene;
    library: ILibraryItem[];
    timeline: LokumEditor;
    bpm: number;
}

const globalState: IState = {
    scene: { props: [] },
    library: [],
    timeline: new LokumEditor(),
    bpm: 130
};

export default globalState;
