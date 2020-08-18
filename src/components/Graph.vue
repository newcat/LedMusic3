<template lang="pug">
v-card.d-flex.flex-column(flat, @drop="drop" @dragover="$event.preventDefault()")
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title
            | Graph Editor
            small(v-if="selectedGraph") &nbsp; ({{ selectedGraph.name }})
    baklava-editor(v-if="selectedGraph", :plugin="selectedGraph.editor.viewPlugin", :key="selectedGraphId")
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { globalState } from "@/entities/globalState";
import { LibraryItemType, GraphLibraryItem } from "../entities/library";

@Component
export default class Graph extends Vue {
    selectedGraphId = "";

    get selectedGraph() {
        return globalState.library.getItemById(this.selectedGraphId);
    }

    drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.getItemById(id);
        if (libraryItem && libraryItem.type === LibraryItemType.GRAPH) {
            this.selectedGraphId = (libraryItem as GraphLibraryItem).id;
        }
    }
}
</script>
