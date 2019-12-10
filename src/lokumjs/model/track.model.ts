import uuidv4 from "uuid/v4";
import { Item } from "./item.model";

export class Track {

    public readonly id = uuidv4();
    public name: string;
    public height = 100;
    public items: Item[] = [];
    public removable = true;

    public constructor(name: string) {
        this.name = name;
    }

}
