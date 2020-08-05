<template lang="pug">
v-card.d-flex.flex-column(flat, @drop="drop" @dragover="$event.preventDefault()")
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title
            | Note Editor
            small(v-if="selectedNotePattern") &nbsp; ({{ selectedNotePattern.name }})
    c-note-editor(v-if="selectedNotePattern", :notePattern="selectedNotePattern")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { globalState } from "@/entities/globalState";
import { LibraryItemType, NotePattern } from "../entities/library";
import CNoteEditor from "@/editors/note/NoteEditor.vue";

@Component({
    components: { CNoteEditor }
})
export default class NoteEditor extends Vue {

    selectedNotePatternId = "";

    get selectedNotePattern() {
        return globalState.library.getItemById(this.selectedNotePatternId);
    }

    drop(ev: DragEvent) {
        const id = ev.dataTransfer!.getData("id");
        const libraryItem = globalState.library.getItemById(id);
        if (libraryItem && libraryItem.type === LibraryItemType.NOTE_PATTERN) {
            this.selectedNotePatternId = (libraryItem as NotePattern).id;
        }
    }

}
</script>