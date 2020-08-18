import uuidv4 from "uuid/v4";

export enum LibraryItemType {
    AUDIO_FILE = 1,
    GRAPH = 2,
    AUTOMATION_CLIP = 3,
    NOTE_PATTERN = 4
}

export abstract class LibraryItem {

    public id: string = uuidv4();

    public abstract type: LibraryItemType;
    public abstract name: string;

    public loading: boolean = false;
    public error: boolean = false;

    public abstract serialize(): Buffer;
    public abstract deserialize(buffer: Buffer): void;

}
