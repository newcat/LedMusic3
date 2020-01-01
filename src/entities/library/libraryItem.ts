export enum LibraryItemType {
    AUDIO_FILE = 1,
    GRAPH = 2,
    AUTOMATION_CLIP = 3
}

export interface ILibraryItem {
    id: string;
    type: LibraryItemType;
    name: string;
    loading: boolean;
    serialize(): Buffer;
}
