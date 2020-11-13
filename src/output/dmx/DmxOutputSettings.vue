<template lang="pug">
div
    v-text-field(outlined, label="Port", v-model="port")
    v-text-field(outlined, label="Channels", v-model="channels")
    v-btn(text, @click="apply") Apply
    v-btn(text, @click="updateValues") Cancel
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { DmxOutput } from "./dmx.output";

@Component
export default class DmxOutputSettings extends Vue {
    port = "";
    channels = "";

    @Prop()
    output!: DmxOutput;

    mounted() {
        this.updateValues();
    }

    updateValues() {
        const { port, channels } = this.output.state;
        this.port = port;
        this.channels = channels;
    }

    apply() {
        this.output.applyState({
            port: this.port,
            channels: this.channels,
        });
        this.updateValues();
    }
}
</script>
