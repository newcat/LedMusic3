import { LibraryItem, LibraryItemType } from "./libraryItem";
import { serialize, deserialize, Binary } from "bson";
import { AudioFile } from "./audioFile";
import { AutomationClip } from "./automationClip";
import { GraphLibraryItem } from "./graphLibraryItem";
import { BaklavaEvent } from "@baklavajs/events";
import { NotePattern } from "./notePattern";

export class LibraryModel {
    public events = {
        itemAdded: new BaklavaEvent<LibraryItem>(),
        itemRemoved: new BaklavaEvent<LibraryItem>(),
    };

    private _items: LibraryItem[] = [];

    public get items() {
        return this._items as ReadonlyArray<LibraryItem>;
    }

    public save(): Buffer {
        return serialize(
            this.items.map((i) => ({
                type: i.type,
                data: i.serialize(),
            }))
        );
    }

    public load(serialized: Binary) {
        const newItemStates = deserialize(serialized.buffer);
        const newItems: LibraryItem[] = [];

        for (const item of newItemStates) {
            if (!item) {
                break;
            }
            const { type, data } = item;
            const buffer = data.buffer;
            let libItem: LibraryItem | undefined;
            switch (type) {
                case LibraryItemType.AUDIO_FILE:
                    libItem = new AudioFile();
                    break;
                case LibraryItemType.AUTOMATION_CLIP:
                    libItem = new AutomationClip();
                    break;
                case LibraryItemType.GRAPH:
                    libItem = new GraphLibraryItem();
                    break;
                case LibraryItemType.NOTE_PATTERN:
                    libItem = new NotePattern();
                    break;
                default:
                    // tslint:disable-next-line: no-console
                    console.warn(`Unknown library type: ${type}`);
            }

            if (libItem) {
                libItem.deserialize(buffer);
                if ((libItem as any).load) {
                    (libItem as any).load();
                }
                newItems.push(libItem);
            }
        }

        this._items = newItems;
    }

    public getItemById(id: string) {
        return this.items.find((i) => i.id === id);
    }

    public addItem(item: LibraryItem) {
        this._items.push(item);
        this.events.itemAdded.emit(item);
    }

    public removeItem(item: LibraryItem) {
        const i = this._items.indexOf(item);
        if (i >= 0) {
            this._items.splice(i, 1);
            this.events.itemRemoved.emit(item);
        }
    }
}
