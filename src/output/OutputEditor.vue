<template lang="pug">
.output-editor
    v-select(
        style="max-width: 12em;",
        outlined,
        label="Output Type",
        :items="outputTypes",
        :value="output.outputInstance.type",
        @input="onOutputTypeChanged")
    component(v-if="outputSettingsComponent", :is="outputSettingsComponent", :output="output.outputInstance")
</template>

<script lang="ts">
import { VueConstructor } from "vue";
import { Component, Prop, Vue } from "vue-property-decorator";
import { OutputType } from "./outputTypes";
import { OutputLibraryItem } from "./output.libraryItem";

import WledOutputSettings from "./wled/WledOutputSettings.vue";
import { createOutput } from "./outputFactory";

const outputSettingsComponentMapping: Record<OutputType, VueConstructor<Vue> | undefined> = {
    [OutputType.DUMMY]: undefined,
    [OutputType.WLED]: WledOutputSettings,
};

@Component
export default class OutputEditor extends Vue {
    @Prop()
    output!: OutputLibraryItem;

    outputTypes = [
        { text: "Dummy", value: OutputType.DUMMY },
        { text: "WLED", value: OutputType.WLED },
    ];

    get outputSettingsComponent() {
        return outputSettingsComponentMapping[this.output.outputInstance.type];
    }

    async onOutputTypeChanged(newOutputType: OutputType) {
        await this.output.outputInstance.destroy();
        this.output.outputInstance = createOutput(newOutputType);
    }
}
</script>

<style lang="scss" scoped>
.output-editor {
    margin: 1em;
}
</style>
