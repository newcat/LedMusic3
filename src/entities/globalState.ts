import { ILibraryItem } from "./library/libraryItem";

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
    bpm: number;
}

const globalState: IState = {
    scene: { props: [] },
    library: [],
    bpm: 130
};

export default globalState;
