<template lang="pug">
v-dialog(:value="value", @input="$emit('input', $event)" max-width="400")
    v-card
        v-card-title
            .headline Settings
        v-card-text
            v-text-field(outlined, label="BPM", v-model="vBpm")
            v-text-field(outlined, label="FPS", v-model="vFps")
        v-card-actions
            v-spacer
            v-btn(text, @click="cancel") Cancel
            v-btn(text, @click="save") Save
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { globalState } from "@/entities/globalState";

@Component
export default class Settings extends Vue {

    @Prop()
    value!: boolean;

    vBpm = "0";
    vFps = "0";

    @Watch("value")
    updateValues() {
        this.vBpm = globalState.bpm.toString();
        this.vFps = globalState.fps.toString();
    }

    cancel() {
        this.$emit("input", false);
    }

    save() {
        this.$emit("input", false);
        // TODO: Validation
        globalState.bpm = parseInt(this.vBpm, 10);
        globalState.fps = parseInt(this.vFps, 10);
    }

}
</script>