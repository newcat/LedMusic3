import { deserialize, serialize } from "bson";
import { LibraryItem, LibraryItemType } from "@/library";
import { BaseOutput } from "./base.output";
import { createOutput } from "./outputFactory";
import { OutputType } from "./outputTypes";

export class OutputLibraryItem extends LibraryItem {
    public type = LibraryItemType.OUTPUT;
    public name = "Output";
    public outputInstance!: BaseOutput<unknown, unknown>;

    public constructor() {
        super();
        this.outputInstance = createOutput(OutputType.DUMMY);
    }

    public serialize(): Buffer {
        return serialize({
            type: this.type,
            state: this.outputInstance.state,
        });
    }

    public deserialize(buffer: Buffer): void {
        const { type, state } = deserialize(buffer);
        this.outputInstance = createOutput(type);
        this.outputInstance.applyState(state);
    }

    public async destroy() {
        await this.outputInstance?.destroy();
    }
}
