import Vue from "vue";
import { Node } from "@baklavajs/core";
import { globalProcessor } from "@/processing";
import { globalState } from "@/entities/globalState";

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

    public calculate() {

        const min = this.getInterface("Min").value;
        const max = this.getInterface("Max").value;

        const selectedName = this.getOptionValue("Track");
        const track = globalState.timeline.tracks.find((t) => t.name === selectedName);
        let value = 0;
        if (track) {
            value = globalProcessor.timelineProcessor.automationClipValues.get(track.id) ?? 0;
        }

        this.getInterface("Value").value = min + value * (max - min);
    }

    public destroy() {
        globalState.timeline.events.trackAdded.unsubscribe(this);
        globalState.timeline.events.trackRemoved.unsubscribe(this);
    }

    private updateAvailableTracks() {
        // TODO: Check why this doesnt update in the view (probably bakalava issue)
        Vue.set(this.options.get("Track")!, "items", globalState.timeline.tracks.map((t) => t.name));
    }

}
