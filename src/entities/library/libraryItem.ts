export type LibraryItemType = "audioFile";

export interface ILibraryItem {
    type: LibraryItemType;
    name: string;
    loading: boolean;
}
