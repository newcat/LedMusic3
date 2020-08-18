<template lang="pug">
v-card(flat)
    v-toolbar(dense, flat)
        v-toolbar-title Library
        v-spacer
        v-menu(bottom, left)
            template(v-slot:activator="{ on }")
                v-btn(icon, v-on="on")
                    v-icon add
            v-list
                v-list-item(@click="openFileDialog")
                    v-list-item-title Audio
                v-list-item(@click="addGraph")
                    v-list-item-title Graph
                v-list-item(@click="addAutomationClip")
                    v-list-item-title Automation Clip
                v-list-item(@click="addNotePattern")
                    v-list-item-title Note Pattern

    v-container(fluid, style="height: calc(100% - 48px); overflow-y: auto;", grid-list-md)
        .library-grid
            v-card.pa-3(
                v-for="(item, i) in items", :key="i",
                outlined, draggable, color="#424250",
                @dragstart="dragstart($event, item.id)",
                @dblclick="openItemSettings(item)"
            )
                .library-item
                    div.mb-2
                        v-progress-circular(v-if="item.loading", indeterminate, color="primary")
                        v-icon(v-else) {{ getIcon(item) }}
                    | {{ item.name }}

    input(ref="fileinput", type="file", @change="loadAudio", style="display: none;")
    item-settings(v-model="settingsOpen", :item="settingsItem")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { AudioFile, AutomationClip, GraphLibraryItem, LibraryItemType, LibraryItem, NotePattern } from "@/entities/library";
import { globalState } from "@/entities/globalState";
import ItemSettings from "./LibraryItemSettings.vue";

@Component({
    components: { ItemSettings }
})
export default class Library extends Vue {

    globalState = globalState;
    settingsOpen = false;
    settingsItem: LibraryItem|null = null;

    get items() {
        return this.globalState.library.items;
    }

    public openFileDialog() {
        (this.$refs.fileinput as HTMLElement).click();
    }

    public async loadAudio(ev: any) {
        const f = ev.target.files[0] as File;
        if (!f) { return; }
        const item = new AudioFile();
        item.name = f.name;
        item.path = f.path;
        this.globalState.library.addItem(item);
        await item.load();
    }

    public dragstart(ev: DragEvent, id: string) {
        ev.dataTransfer!.setData("id", id);
    }

    public getIcon(item: LibraryItem) {
        if (item.error) { return "warning"; }
        switch (item.type) {
            case LibraryItemType.AUDIO_FILE:
                return "library_music";
            case LibraryItemType.GRAPH:
                return "device_hub";
            case LibraryItemType.AUTOMATION_CLIP:
                return "timeline";
            case LibraryItemType.NOTE_PATTERN:
                return "queue_music";
            default:
                return "note";
        }
    }

    public addGraph() {
        this.globalState.library.addItem(new GraphLibraryItem());
    }

    public addAutomationClip() {
        this.globalState.library.addItem(new AutomationClip());
    }

    public addNotePattern() {
        this.globalState.library.addItem(new NotePattern());
    }

    public openItemSettings(item: LibraryItem) {
        this.settingsItem = item;
        this.settingsOpen = true;
    }

}
</script>

<style scoped>
.library-grid {
    display: grid;
    grid-gap: 10px;
    grid-auto-flow: row;
    grid-auto-rows: 1fr;
    grid-template-columns: repeat(3, 1fr);
}


.library-item {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
    text-align: center;
    height: 100%;
    min-height: 4em;
}
</style>