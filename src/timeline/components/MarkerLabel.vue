<template lang="pug">
.marker-label(:class="classes", :style="styles") {{ label }}
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { IMarker } from "../types";
import { TICKS_PER_BEAT } from "@/constants";

@Component
export default class MarkerLabel extends Vue {
    @Prop()
    marker!: IMarker;

    get classes() {
        return {
            "--major": this.marker.type === "major",
            "--minor": this.marker.type === "minor",
        };
    }

    get styles() {
        return {
            transform: `translate(${this.marker.position}px, -50%) translateX(-50%)`,
        };
    }

    get label() {
        const value = this.marker.unit / (TICKS_PER_BEAT * 4);
        return Number.isInteger(value) ? value.toString() : "";
    }
}
</script>
