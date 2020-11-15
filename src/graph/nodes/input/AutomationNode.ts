import { Node } from "@baklavajs/core";
import { globalState } from "@/globalState";
import { ICalculationData } from "../../types";
import Vue from "vue";

export class AutomationNode extends Node {
    public type = "Automation";
    public name = this.type;

    private vueInstance: Vue;

    public constructor() {
        super();
        this.addInputInterface("Min", "NumberOption", 0, { type: "number" });
        this.addInputInterface("Max", "NumberOption", 1, { type: "number" });
        this.addOption("Track", "SelectOption", "", undefined, { items: [] });
        this.addOutputInterface("Value", { type: "number" });

        // Hacky workaround because the nx-js observer doesnt pick the change up
        // for whatever reason
        this.vueInstance = new Vue();
        this.vueInstance.$watch(
            () => globalState.timeline.tracks.map((t) => t.name),
            () => {
                this.updateAvailableTracks();
            },
            { immediate: true }
        );
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
        this.vueInstance.$destroy();
    }

    private updateAvailableTracks() {
        const optionItems: Array<{ text: string; value: string }> = [];
        for (const track of globalState.timeline.tracks) {
            optionItems.push({ text: track.name, value: track.id });
        }
        const trackOption = this.options.get("Track")!;
        trackOption.items = optionItems;
        trackOption.events.updated.emit();
    }
}
