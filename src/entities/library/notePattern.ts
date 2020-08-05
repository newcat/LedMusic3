import { serialize, deserialize } from "bson";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
import uuidv4 from "uuid/v4";
import { StandardEvent } from "@/lokumjs";
import { INote } from "@/editors/note/types";

export class NotePattern implements ILibraryItem {

    public static deserialize(data: Buffer) {
        const { id, name, notes } = deserialize(data);
        const np = new NotePattern(name, notes);
        np.id = id;
        return np;
    }

    public id = uuidv4();
    public type = LibraryItemType.NOTE_PATTERN;
    public name: string;
    public loading = false;

    public notes: INote[];

    public events = {
        notesUpdated: new StandardEvent()
    };

    public constructor(name = "Note Pattern", notes?: INote[]) {
        this.name = name;
        this.notes = notes || [];
    }

    public serialize() {
        return serialize({
            id: this.id,
            name: this.name,
            notes: this.notes,
        });
    }

}
