import { ILibraryItem, LibraryItemType } from "./libraryItem";
import { serialize, deserialize, Binary } from "bson";
import { AudioFile } from "./audioFile";
import { AutomationClip } from "./automationClip";
import { GraphLibraryItem } from "./graphLibraryItem";

export class LibraryModel {

    private _items: ILibraryItem[] = [];

    public get items() {
        return this._items as ReadonlyArray<ILibraryItem>;
    }

    public save(): Buffer {
        return serialize(this.items.map((i) => ({
            type: i.type,
            data: i.serialize()
        })));
    }

    public load(serialized: Binary) {

        const newItemStates = deserialize(serialized.buffer);
        const newItems: ILibraryItem[] = [];

        for (const item of newItemStates) {
            if (!item) { break; }
            const { type, data } = item;
            const buffer = data.buffer;
            switch (type) {
                case LibraryItemType.AUDIO_FILE:
                    newItems.push(AudioFile.deserialize(buffer));
                    break;
                case LibraryItemType.AUTOMATION_CLIP:
                    newItems.push(AutomationClip.deserialize(buffer));
                    break;
                case LibraryItemType.GRAPH:
                    newItems.push(GraphLibraryItem.deserialize(buffer));
                    break;
                default:
                    // tslint:disable-next-line: no-console
                    console.warn(`Unknown library type: ${type}`);
            }
        }

        this._items = newItems;

    }

    public getItemById(id: string) {
        return this.items.find((i) => i.id === id);
    }

    public addItem(item: ILibraryItem) {
        this._items.push(item);
    }

}
