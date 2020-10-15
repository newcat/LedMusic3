<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title
            | Editor
            small(v-if="selectedItem") &nbsp; ({{ selectedItem.name }})
    baklava-editor(v-if="isGraph", :plugin="selectedItem.editor.viewPlugin", :key="selectedItemId")
    note-editor(v-else-if="isPattern", :notePattern="selectedItem", :key="selectedItemId")
    automation-editor(v-else-if="isAutomation", :automationClip="selectedItem", :key="selectedItemId")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { globalState } from "@/globalState";
import { LibraryItemType } from "@/library";
import { NoteEditor } from "@/pattern";
import { AutomationEditor } from "@/automation";

@Component({
    components: { NoteEditor, AutomationEditor },
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

    get isAutomation() {
        return this.selectedItem?.type === LibraryItemType.AUTOMATION;
    }

    get isPattern() {
        return this.selectedItem?.type === LibraryItemType.PATTERN;
    }
}
</script>
