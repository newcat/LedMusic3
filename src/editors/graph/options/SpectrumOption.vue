<template>
<canvas class="spectrum-canvas" ref="canvas"></canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component
export default class SpectrumOption extends Vue {

    @Prop()
    public value!: Float32Array;

    public mounted() {
        this.draw();
    }

    @Watch("value")
    public draw() {

        if (!this.value) { return; }
        const cv = this.$refs.canvas as HTMLCanvasElement|undefined;
        if (!cv) { return; }
        const ctx = cv.getContext("2d");
        if (!ctx) { return; }
        const { width, height } = cv;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);

        const barWidth = width / this.value.length;

        this.value.forEach((v, i) => {
            const b = 255 * v;
            ctx.fillStyle = `rgb(${b}, ${b}, ${b})`;
            ctx.fillRect(i * barWidth, 0, barWidth, height);
        });

    }

}
</script>

<style scoped>
.spectrum-canvas {
    width: 100%;
    height: 20px;
}
</style>