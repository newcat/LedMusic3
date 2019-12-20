import { ILibraryItem, LibraryItemType } from "./libraryItem";
import uuidv4 from "uuid/v4";
import { BaklavaEditor } from "@/editors/graph";

export class GraphLibraryItem implements ILibraryItem {

    public readonly id = uuidv4();
    public type = LibraryItemType.GRAPH;
    public name = "Graph";
    public loading = false;

    public editor = new BaklavaEditor();

}
