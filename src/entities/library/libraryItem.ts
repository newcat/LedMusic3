export type LibraryItemType = "audioFile";

export interface ILibraryItem {
    id: string;
    type: LibraryItemType;
    name: string;
    loading: boolean;
}
