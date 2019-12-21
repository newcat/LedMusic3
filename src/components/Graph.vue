<template lang="pug">
v-card
    v-toolbar(dense)
        v-toolbar-title Graph Editor
        v-spacer
        v-toolbar-items
            v-select(dense, outlined, v-model="selectedGraphId", label="Edit Graph", :items="graphs")

    v-container.fill-height(fluid)
        baklava-editor(v-if="selectedGraph", :plugin="selectedGraph.editor.viewPlugin")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import globalState from "@/entities/globalState";
import { LibraryItemType } from "../entities/library";

@Component
export default class Graph extends Vue {

    selectedGraphId = "";

    get selectedGraph() {
        return globalState.library.find((i) => i.id === this.selectedGraphId);
    }

    get graphs() {
        return globalState.library
            .filter((i) => i.type === LibraryItemType.GRAPH)
            .map((i) => ({ text: i.name, value: i.id }));
    }

}
</script>