import { Node } from "@baklavajs/core";
import { globalState } from "@/globalState";
import { ICalculationData } from "../../types";

export class AutomationNode extends Node {
    public type = "Automation";
    public name = this.type;

    public constructor() {
        super();
        this.addInputInterface("Min", "NumberOption", 0, { type: "number" });
        this.addInputInterface("Max", "NumberOption", 1, { type: "number" });
        this.addOption("Track", "SelectOption", "", undefined, { items: [] });
        this.addOutputInterface("Value", { type: "number" });
        this.updateAvailableTracks();
        globalState.timeline.events.trackAdded.addListener(this, () => this.updateAvailableTracks());
        globalState.timeline.events.trackRemoved.addListener(this, () => this.updateAvailableTracks());
    }

    public calculate(data: ICalculationData) {
        const min = this.getInterface("Min").value;
        const max = this.getInterface("Max").value;

        const { trackValues } = data;

        const selectedTrack = this.getOptionValue("Track");
        let value = 0;
        if (selectedTrack) {
            const trackValue = trackValues.get(selectedTrack);
            if (typeof trackValue === "number") {
                value = trackValue;
            }
        }

        this.getInterface("Value").value = min + value * (max - min);
    }

    public destroy() {
        globalState.timeline.events.trackAdded.removeListener(this);
        globalState.timeline.events.trackRemoved.removeListener(this);
    }

    private updateAvailableTracks() {
        const trackOption = this.options.get("Track")!;
        trackOption.items = globalState.timeline.tracks.map((t) => ({
            text: t.name,
            value: t.id,
        }));
        trackOption.events.updated.emit();
    }
}
