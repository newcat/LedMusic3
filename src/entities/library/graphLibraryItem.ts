import { serialize, deserialize } from "bson";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
import uuidv4 from "uuid/v4";
import { BaklavaEditor } from "@/editors/graph";
import { IState } from "@baklavajs/core/dist/types";

export class GraphLibraryItem implements ILibraryItem {

    public static deserialize(data: Buffer) {
        const { id, name, state } = deserialize(data);
        const g = new GraphLibraryItem(state);
        g.id = id;
        g.name = name;
        return g;
    }

    public id = uuidv4();
    public type = LibraryItemType.GRAPH;
    public name = "Graph";
    public loading = false;

    public editor = new BaklavaEditor();

    public constructor(state?: IState) {
        if (state) { this.editor.load(state); }
    }

    public serialize() {
        return serialize({
            id: this.id,
            name: this.name,
            state: this.editor.save()
        });
    }

}
