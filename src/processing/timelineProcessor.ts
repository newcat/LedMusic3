import { AudioProcessor } from "./audioProcessor";
import { Editor, Item } from "@/lokumjs";
import { AudioFile, ILibraryItem, LibraryItemType, GraphLibraryItem, AutomationClip } from "@/entities/library";

export class TimelineProcessor {

    public automationClipValues = new Map<string, number>(); // maps trackId -> value

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

        currentActiveItems.filter((i) => this.isType(i, LibraryItemType.AUTOMATION_CLIP)).forEach((i) => this.processAutomationClip(unit, i));
        currentActiveItems.filter((i) => this.isType(i, LibraryItemType.GRAPH)).forEach((i) => this.processGraph(i));
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
        } else if (libraryItem.type === LibraryItemType.AUTOMATION_CLIP) {
            const ac = libraryItem as AutomationClip;
            // TODO: This doesn't work if the automation clip ends before the last point
            this.automationClipValues.set(item.trackId, ac.lastValue);
        }
    }

    private isType(item: Item, type: LibraryItemType): boolean {
        if (!item.data || !item.data.libraryItem) { return false; }
        const libraryItem = item.data.libraryItem as ILibraryItem;
        return libraryItem.type === type;
    }

    private processGraph(item: Item): void {
        const graph = item.data!.libraryItem as GraphLibraryItem;
        graph.editor.enginePlugin.calculate();
    }

    private processAutomationClip(unit: number, item: Item): void {
        const ac = item.data!.libraryItem as AutomationClip;
        const value = ac.getValueAt(unit - item.start);
        this.automationClipValues.set(item.trackId, value);
    }

}
