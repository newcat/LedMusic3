import { Node } from "@baklavajs/core";
import { observe } from "@nx-js/observer-util";
import { globalState } from "@/globalState";
import { OutputLibraryItem, OutputType } from "@/output";
import { LibraryItemType } from "@/library";

const compatibleOutputTypes: OutputType[] = [OutputType.DUMMY, OutputType.WLED, OutputType.DMX];

export class StripOutputNode extends Node {
    public type = "Strip Output";
    public name = this.type;

    private unobserve: () => void;

    public constructor() {
        super();
        this.addInputInterface("Colors", undefined, [[0, 0, 0]], { type: "color_array" });
        this.addOption("Preview", "PreviewOption", [[0, 0, 0]]);
        this.addOption("Output", "SelectOption", "", undefined, { items: [] });
        this.unobserve = observe(() => this.updateOutputs());
    }

    public calculate() {
        const id = this.getOptionValue("Output");
        const colors = this.getInterface("Colors").value;
        this.setOptionValue("Preview", colors);
        if (id) {
            return {
                id,
                data: {
                    colors,
                },
            };
        }
    }

    public destroy() {
        this.unobserve();
    }

    private updateOutputs() {
        console.log("Update outputs called");
        const items = globalState.library.items
            .filter((i) => i.type === LibraryItemType.OUTPUT)
            .filter((o) => compatibleOutputTypes.includes((o as OutputLibraryItem).outputInstance.type))
            .map((o) => ({ text: o.name, value: o.id }));
        const outputOption = this.options.get("Output")!;
        outputOption.items = items;
        outputOption.events.updated.emit();
    }
}
