import { AudioProcessor } from "./audioProcessor";
import { Editor, Item } from "../lokumjs";
import { ItemTypes } from "@/entities/timeline/itemTypes";
import { AudioFile } from "@/entities/library";

export class TimelineProcessor {

    private activeItems: Item[] = [];

    public constructor(
        private audioProcessor: AudioProcessor,
        private lokumEditor: Editor
    ) {}

    public process(unit: number) {

        const currentActiveItems = this.lokumEditor.items.filter((i) => i.start <= unit && i.end >= unit);

        const newActiveItems = currentActiveItems.filter((i) => !this.activeItems.includes(i));
        newActiveItems.forEach((i) => this.activate(i));

        const newInactiveItems = this.activeItems.filter((i) => !currentActiveItems.includes(i));
        newInactiveItems.forEach((i) => this.deactivate(i));

        currentActiveItems.forEach((i) => this.processItem(i));
        this.activeItems = currentActiveItems;

    }

    private activate(item: Item) {
        if (!item.data || typeof(item.data.type) !== "number") { return; }
        const type = item.data.type as ItemTypes;
        if (type === ItemTypes.AUDIO) {
            const libraryItem = item.data.libraryItem as AudioFile;
            this.audioProcessor.registerBuffer(libraryItem.audioBuffer!, item.start);
            item.events.moved.subscribe(this, () => {
                this.audioProcessor.unregisterBuffer(libraryItem.audioBuffer!);
                this.audioProcessor.registerBuffer(libraryItem.audioBuffer!, item.start);
            });
        }
    }

    private deactivate(item: Item) {
        if (!item.data || !item.data.type) { return; }
        const type = item.data.type as ItemTypes;
        if (type === ItemTypes.AUDIO) {
            const libraryItem = item.data.libraryItem as AudioFile;
            item.events.moved.unsubscribe(this);
            this.audioProcessor.unregisterBuffer(libraryItem.audioBuffer!);
        }
    }

    private processItem(item: Item) {
        // TODO: apply the automation clips and perform all necessary graph calculations
    }

}
