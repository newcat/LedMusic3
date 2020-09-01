import { AudioProcessor } from "./audioProcessor";
import { TimelineEditor, Item } from "@/editors/timeline";
import {
    AudioFile,
    LibraryItem,
    LibraryItemType,
    GraphLibraryItem,
    AutomationClip,
    NotePattern,
} from "@/entities/library";
import { globalState } from "@/entities/globalState";
import { INote } from "@/editors/note/types";
import { ICalculationData } from "@/editors/graph/types";

export class TimelineProcessor {
    public trackValues = new Map<string, number | INote[]>(); // maps trackId -> value
    private activeItems: Item[] = [];

    public constructor(private audioProcessor: AudioProcessor, private lokumEditor: TimelineEditor) {}

    public process(unit: number) {
        const currentActiveItems = this.lokumEditor.items.filter((i) => i.start <= unit && i.end >= unit);

        const newActiveItems = currentActiveItems.filter((i) => !this.activeItems.includes(i));
        newActiveItems.forEach((i) => this.activate(i));

        const newInactiveItems = this.activeItems.filter((i) => !currentActiveItems.includes(i));
        newInactiveItems.forEach((i) => this.deactivate(i));

        this.activeItems = currentActiveItems;

        currentActiveItems
            .filter((i) => this.isType(i, LibraryItemType.AUTOMATION_CLIP))
            .forEach((i) => this.processAutomationClip(unit, i));
        currentActiveItems
            .filter((i) => this.isType(i, LibraryItemType.NOTE_PATTERN))
            .forEach((i) => this.processNotePattern(unit, i));

        const fftSize = this.audioProcessor.analyserNode.fftSize;
        const timeDomainData = new Float32Array(fftSize);
        this.audioProcessor.analyserNode.getFloatTimeDomainData(timeDomainData);
        const frequencyData = new Float32Array(fftSize);
        this.audioProcessor.analyserNode.getFloatFrequencyData(frequencyData);

        const calculationData: ICalculationData = {
            resolution: globalState.resolution,
            fps: globalState.fps,
            position: unit,
            sampleRate: this.audioProcessor.audioContext.sampleRate,
            timeDomainData,
            frequencyData,
            trackValues: this.trackValues,
        };
        currentActiveItems
            .filter((i) => this.isType(i, LibraryItemType.GRAPH))
            .forEach((i) => this.processGraph(i, calculationData));
    }

    private activate(item: Item) {
        if (item.libraryItem.type === LibraryItemType.AUDIO_FILE) {
            const af = item.libraryItem as AudioFile;
            if (af.loading) {
                af.events.loaded.addListener(this, () => {
                    af.events.loaded.removeListener(this);
                    this.activate(item);
                });
            }
            this.audioProcessor.registerBuffer(af.audioBuffer!, item.start);
            item.events.moved.addListener(this, () => {
                this.audioProcessor.unregisterBuffer(af.audioBuffer!);
                this.audioProcessor.registerBuffer(af.audioBuffer!, item.start);
            });
            item.events.beforeMoved.addListener(this, () => {
                // TODO: moving an audio item while playing causes continuos stuttering during playback for whatever reason.
                // As a workaround, prevent items from being moved while playing
                if (globalState.isPlaying) {
                    return false;
                }
            });
        }
    }

    private deactivate(item: Item) {
        if (item.libraryItem.type === LibraryItemType.AUDIO_FILE) {
            const af = item.libraryItem as AudioFile;
            item.events.moved.removeListener(this);
            item.events.beforeMoved.removeListener(this);
            this.audioProcessor.unregisterBuffer(af.audioBuffer!);
        }
    }

    private isType(item: Item, type: LibraryItemType): boolean {
        return item.libraryItem.type === type;
    }

    private processGraph(item: Item, calculationData: ICalculationData): void {
        const graph = item.libraryItem as GraphLibraryItem;
        graph.editor.enginePlugin.calculate(calculationData);
    }

    private processAutomationClip(unit: number, item: Item): void {
        const ac = item.libraryItem as AutomationClip;
        const value = ac.getValueAt(unit - item.start);
        this.trackValues.set(item.trackId, value);
    }

    private processNotePattern(unit: number, item: Item): void {
        const np = item.libraryItem as NotePattern;
        const notes = np.getNotesAt(unit - item.start);
        this.trackValues.set(item.trackId, notes);
    }
}
