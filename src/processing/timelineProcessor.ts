import { AudioProcessor } from "./audioProcessor";
import { Editor, Item } from "@/lokumjs";
import { AudioFile, ILibraryItem, LibraryItemType, GraphLibraryItem } from "@/entities/library";

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
        if (!item.data || !item.data.libraryItem) { return; }
        const libraryItem = item.data.libraryItem as ILibraryItem;
        if (libraryItem.type === LibraryItemType.AUDIO_FILE) {
            const af = libraryItem as AudioFile;
            this.audioProcessor.registerBuffer(af.audioBuffer!, item.start);
            item.events.moved.subscribe(this, () => {
                this.audioProcessor.unregisterBuffer(af.audioBuffer!);
                this.audioProcessor.registerBuffer(af.audioBuffer!, item.start);
            });
        }
    }

    private deactivate(item: Item) {
        if (!item.data || !item.data.libraryItem) { return; }
        const libraryItem = item.data.libraryItem as ILibraryItem;
        if (libraryItem.type === LibraryItemType.AUDIO_FILE) {
            const af = libraryItem as AudioFile;
            item.events.moved.unsubscribe(this);
            this.audioProcessor.unregisterBuffer(af.audioBuffer!);
        }
    }

    private processItem(item: Item) {
        if (!item.data || !item.data.libraryItem) { return; }
        // TODO: apply the automation clips and perform all necessary graph calculations
        const libraryItem = item.data.libraryItem as ILibraryItem;
        switch (libraryItem.type) {
            case LibraryItemType.GRAPH:
                const graph = libraryItem as GraphLibraryItem;
                graph.editor.enginePlugin.calculate();
                break;
        }
    }

}
