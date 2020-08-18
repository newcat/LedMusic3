import Vue from "vue";
import { Node } from "@baklavajs/core";
import { globalState } from "@/entities/globalState";
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
        globalState.timeline.events.trackAdded.subscribe(this, () => this.updateAvailableTracks());
        globalState.timeline.events.trackRemoved.subscribe(this, () => this.updateAvailableTracks());
    }

    public calculate(data: ICalculationData) {

        const min = this.getInterface("Min").value;
        const max = this.getInterface("Max").value;

        const { trackValues } = data;

        const selectedTrack = this.getOptionValue("Track");
        let value = 0;
        if (selectedTrack) {
            const trackValue = trackValues.get(selectedTrack);
            if (typeof(trackValue) === "number") {
                value = trackValue;
            }
        }

        this.getInterface("Value").value = min + value * (max - min);
    }

    public destroy() {
        globalState.timeline.events.trackAdded.unsubscribe(this);
        globalState.timeline.events.trackRemoved.unsubscribe(this);
    }

    private updateAvailableTracks() {
        // TODO: Check why this doesnt update in the view (probably bakalava issue)
        Vue.set(this.options.get("Track")!, "items", globalState.timeline.tracks.map((t) => ({
            text: t.name,
            value: t.id
        })));
    }

}
