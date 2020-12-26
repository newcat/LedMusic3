<template lang="pug">
.position-marker(:style="styles")
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import { globalState } from "@/globalState";
import { TimelineEditor } from "../model";

@Component
export default class PositionMarker extends Vue {
    @Prop({ type: Object, required: true })
    editor!: TimelineEditor;

    globalState = globalState;

    get styles() {
        return {
            transform: `translateX(${this.globalState.position * this.editor.unitWidth + this.editor.headerWidth}px)`,
        };
    }
}
</script>
