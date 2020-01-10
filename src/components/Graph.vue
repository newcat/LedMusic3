<template lang="pug">
v-card.d-flex.flex-column
    div.d-flex.px-3.align-items-center.elevation-4(style="height:48px")
        div.flex-grow-1
            v-toolbar-title Graph Editor
        div.flex-grow-1
            c-select.flex-grow-1(v-model="selectedGraphId", label="Edit Graph", :items="graphs")

    baklava-editor(v-if="selectedGraph", :plugin="selectedGraph.editor.viewPlugin", :key="selectedGraphId")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import globalState from "@/entities/globalState";
import { LibraryItemType } from "../entities/library";
import CSelect from "@/components/elements/Select.vue";

@Component({
    components: { CSelect }
})
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