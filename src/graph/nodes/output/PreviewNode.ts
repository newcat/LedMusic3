import { Node } from "@baklavajs/core";

export class PreviewNode extends Node {
    public type = "Preview";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("Colors", undefined, [[0, 0, 0]], { type: "color_array" });
        this.addOption("Preview", "PreviewOption", [[0, 0, 0]]);
        this.addOption("Led Count", "NumberOption", 30, undefined, { min: 1 });
    }

    public calculate() {
        const input = this.getInterface("Colors").value;

        // TODO: Resize input to output size
        //const ledCount = this.getOptionValue("Led Count");

        /* const buff = new Array(ledCount);

        for (let i = 0; i < ledCount; i++) {
            // | | | | | | | | | | | | | | | |
            // |    |    |    |    |    |    |
        } */

        this.setOptionValue("Preview", input);
        return input;
        /*globalProcessor.globalPreview = input;
        globalProcessor.events.globalPreviewUpdated.emit();*/
    }
}
