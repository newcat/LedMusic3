import uuidv4 from "uuid/v4";

export class Item {

    public readonly id = uuidv4();
    public start: number;
    public end: number;
    public selected = false;
    public resizable = true;
    public data?: Record<string, any>;

    public constructor(start: number, end: number, data?: Record<string, any>) {
        this.start = start;
        this.end = end;
        this.data = data;
    }

}
