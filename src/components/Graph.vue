<template lang="pug">
v-card.d-flex.flex-column(@drop="drop" @dragover="$event.preventDefault()")
    div.d-flex.align-items-center.px-3.elevation-4(style="height:48px")
        v-toolbar-title
            | Graph Editor
            small(v-if="selectedGraph") &nbsp; ({{ selectedGraph.name }})
    baklava-editor(v-if="selectedGraph", :plugin="selectedGraph.editor.viewPlugin", :key="selectedGraphId")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import globalState from "@/entities/globalState";
import { LibraryItemType, GraphLibraryItem } from "../entities/library";
import CSelect from "@/components/elements/Select.vue";

@Component({
    components: { CSelect }
})
export default class Graph extends Vue {

    selectedGraphId = "";

    get selectedGraph() {
        return globalState.library.find((i) => i.id === this.selectedGraphId);
    }

    drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.find((i) => i.id === id);
        if (libraryItem && libraryItem.type === LibraryItemType.GRAPH) {
            this.selectedGraphId = (libraryItem as GraphLibraryItem).id;
        }
    }

}
</script>