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

    v-container(fluid, style="height: calc(100% - 48px); overflow-y: auto;", grid-list-md)
        .library-grid
            v-card.pa-3(v-for="(item, i) in items", :key="i", outlined, draggable, @dragstart="dragstart($event, item.id)", color="#424250")
                .library-item
                    div.mb-2
                        v-progress-circular(v-if="item.loading", indeterminate, color="primary")
                        v-icon(v-else) {{ getIconByType(item.type) }}
                    | {{ item.name }}

    input(ref="fileinput", type="file", @change="loadAudio", style="display: none;")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { AudioFile, AutomationClip, GraphLibraryItem, LibraryItemType } from "@/entities/library";
import globalState from "@/entities/globalState";

@Component
export default class Library extends Vue {

    globalState = globalState;

    get items() {
        return this.globalState.library.items;
    }

    public openFileDialog() {
        (this.$refs.fileinput as HTMLElement).click();
    }

    public async loadAudio(ev: any) {
        const f = ev.target.files[0] as File;
        if (!f) { return; }
        const reader = new FileReader();
        const buff = await new Promise<ArrayBuffer>((res) => {
            reader.onload = (e) => res(e.target!.result as ArrayBuffer);
            reader.readAsArrayBuffer(f);
        });
        const item = new AudioFile(f.name, buff);
        this.globalState.library.addItem(item);
        await item.load();
    }

    public dragstart(ev: DragEvent, id: string) {
        ev.dataTransfer!.setData("id", id);
    }

    public getIconByType(type: LibraryItemType) {
        switch (type) {
            case LibraryItemType.AUDIO_FILE:
                return "library_music";
            case LibraryItemType.GRAPH:
                return "device_hub";
            case LibraryItemType.AUTOMATION_CLIP:
                return "timeline";
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