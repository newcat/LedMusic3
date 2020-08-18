import { serialize, deserialize } from "bson";
import { LibraryItem, LibraryItemType } from "./libraryItem";
import { StandardEvent } from "@/lokumjs";
import { INote } from "@/editors/note/types";

export class NotePattern extends LibraryItem {
    public type = LibraryItemType.NOTE_PATTERN;
    public name = "Note Pattern";

    public notes: INote[] = [];

    public events = {
        notesUpdated: new StandardEvent(),
    };

    public serialize() {
        return serialize({
            id: this.id,
            name: this.name,
            notes: this.notes,
        });
    }

    public deserialize(buffer: Buffer): void {
        const { id, name, notes } = deserialize(buffer);
        this.id = id;
        this.name = name;
        this.notes = notes;
    }

    public getNotesAt(tick: number) {
        const activeNotes = this.notes.filter((n) => n.start <= tick && n.end >= tick);
        // sort so that the last activated note is at the beginning of the array
        activeNotes.sort((a, b) => b.start - a.start);
        return activeNotes;
    }
}
