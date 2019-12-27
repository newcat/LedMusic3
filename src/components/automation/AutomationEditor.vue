<template>
<div>
    <h3>Custom Distribution</h3>
    <c-select v-model="curveType" label="Curve Type" :items="curveTypes"></c-select>
    <graph-editor
        :loadedPoints="points"
        :min="min"
        :max="max"
        :mode="curveType"
        @pointsUpdated="updatePoints"
    ></graph-editor>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { NodeInterface } from "@baklavajs/core";
import CSelect from "@/components/elements/Select.vue";
import GraphEditor from "./GraphEditor.vue";

type Vector2D = [number, number];

@Component({
    components: { CSelect, GraphEditor }
})
export default class CustomOption extends Vue {

    width: number = 800;

    curveType = "monotone";
    curveTypes = [
        { value: "monotone", text: "Monotone" },
        { value: "linear", text: "Linear" },
    ];

    points = [[0, 0], [1, 1]];

    canvas!: HTMLCanvasElement;
    context!: CanvasRenderingContext2D|null;

    get min() {
        return 0;
    }

    get max() {
        return 1;
    }

    updatePoints(points: Vector2D[]) {
        this.points = points;
    }

}
</script>
