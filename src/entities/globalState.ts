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
}

const globalState: IState = {
    scene: { props: [] },
    library: []
};

export default globalState;
