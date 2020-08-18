import { LibraryItem, LibraryItemType } from "./libraryItem";
import { serialize, deserialize, Binary } from "bson";
import { AudioFile } from "./audioFile";
import { AutomationClip } from "./automationClip";
import { GraphLibraryItem } from "./graphLibraryItem";
import { StandardEvent } from "@/lokumjs";
import { NotePattern } from "./notePattern";

export class LibraryModel {

    public events = {
        itemAdded: new StandardEvent<LibraryItem>(),
        itemRemoved: new StandardEvent<LibraryItem>()
    };

    private _items: LibraryItem[] = [];

    public get items() {
        return this._items as ReadonlyArray<LibraryItem>;
    }

    public save(): Buffer {
        return serialize(this.items.map((i) => ({
            type: i.type,
            data: i.serialize()
        })));
    }

    public load(serialized: Binary) {

        const newItemStates = deserialize(serialized.buffer);
        const newItems: LibraryItem[] = [];

        for (const item of newItemStates) {
            if (!item) { break; }
            const { type, data } = item;
            const buffer = data.buffer;
            switch (type) {
                case LibraryItemType.AUDIO_FILE:
                    const af = new AudioFile();
                    af.deserialize(buffer);
                    af.load();
                    newItems.push(af);
                    break;
                case LibraryItemType.AUTOMATION_CLIP:
                    const ac = new AutomationClip();
                    ac.deserialize(buffer);
                    newItems.push(ac);
                    break;
                case LibraryItemType.GRAPH:
                    const gr = new GraphLibraryItem();
                    gr.deserialize(buffer);
                    newItems.push(gr);
                    break;
                case LibraryItemType.NOTE_PATTERN:
                    const np = new NotePattern();
                    np.deserialize(buffer);
                    newItems.push(np);
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
