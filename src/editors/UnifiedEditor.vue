<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title
            | Editor
            small(v-if="selectedItem") &nbsp; ({{ selectedItem.name }})
    baklava-editor(v-if="isGraph", :plugin="selectedItem.editor.viewPlugin", :key="selectedItemId")
    note-editor(v-else-if="isNotePattern", :notePattern="selectedItem", :key="selectedItemId")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { globalState } from "@/entities/globalState";
import { LibraryItemType } from "@/entities/library";
import NoteEditor from "./note/NoteEditor.vue";

@Component({
    components: { NoteEditor },
})
export default class Graph extends Vue {
    @Prop({ type: String, default: "" })
    selectedItemId!: string;

    get selectedItem() {
        return globalState.library.getItemById(this.selectedItemId);
    }

    get isGraph() {
        return this.selectedItem?.type === LibraryItemType.GRAPH;
    }

    get isAutomationClip() {
        return this.selectedItem?.type === LibraryItemType.AUTOMATION_CLIP;
    }

    get isNotePattern() {
        return this.selectedItem?.type === LibraryItemType.NOTE_PATTERN;
    }
}
</script>
