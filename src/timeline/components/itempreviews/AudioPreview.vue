<template lang="pug">
.audio-file
    canvas(ref="canvas")
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { AudioLibraryItem } from "@/audio";
import { Item } from "../../model";

@Component
export default class Audio extends Vue {
    @Prop({ type: Object, required: true })
    item!: Item;

    @Prop({ type: Number, required: true })
    unitWidth!: number;

    renderingContext: CanvasRenderingContext2D | null = null;
    resizeObserver: ResizeObserver | null = null;

    get libraryItem() {
        return this.item.libraryItem as AudioLibraryItem;
    }

    mounted() {
        this.resizeObserver = new ResizeObserver(() => {
            if (this.$refs.canvas) {
                const canvasEl = this.$refs.canvas as HTMLCanvasElement;
                canvasEl.width = this.$el.clientWidth;
                canvasEl.height = this.$el.clientHeight;
                this.drawWaveform();
            }
        });
        this.resizeObserver.observe(this.$el);
        if (this.$refs.canvas) {
            this.renderingContext = (this.$refs.canvas as HTMLCanvasElement).getContext("2d");
        }
    }

    beforeDestroy() {
        this.resizeObserver?.disconnect();
    }

    @Watch("libraryItem.loading")
    @Watch("libraryItem.waveform")
    @Watch("unitWidth")
    drawWaveform() {
        if (this.renderingContext) {
            if (this.libraryItem.waveform.length === 0 || this.libraryItem.loading) {
                return;
            }
            const height = this.renderingContext.canvas.height;
            const totalSamples = this.libraryItem.waveform[0].total;
            const totalUnits = this.item.end - this.item.start;
            for (const part of this.libraryItem.waveform) {
                const x = (part.start / totalSamples) * totalUnits * this.unitWidth;
                const width = ((part.end - part.start) / totalSamples) * totalUnits * this.unitWidth;
                this.renderingContext.drawImage(part.image, x, 0, width, height);
            }
        }
    }
}
</script>

<style scoped>
.audio-file {
    width: 100%;
    height: 100%;
}
</style>
