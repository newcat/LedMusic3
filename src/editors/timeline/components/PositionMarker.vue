<template lang="pug">
.position-marker(:style="styles")
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { globalState } from "../../../entities/globalState";

@Component
export default class PositionMarker extends Vue {
    @Prop({ type: Number, required: true })
    unitWidth!: number;

    @Prop({ type: Number, required: true })
    headerWidth!: number;

    globalState = globalState;

    get styles() {
        return {
            transform: `translateX(${this.globalState.position * this.unitWidth + this.headerWidth}px)`,
        };
    }
}
</script>
