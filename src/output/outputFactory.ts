import { BaseOutput } from "./base.output";
import { DummyOutput } from "./dummy.output";
import { OutputType } from "./outputTypes";
import { WledOutput } from "./wled/wled.output";

export function createOutput(type: OutputType): BaseOutput<unknown, unknown> {
    switch (type) {
        case OutputType.DUMMY:
            return new DummyOutput();
        case OutputType.WLED:
            return new WledOutput();
        default:
            throw new Error(`Unknown output type: ${type}`);
    }
}
