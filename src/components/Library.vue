<template lang="pug">
v-card
    v-toolbar(dense)
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

    v-container(fluid, style="overflow-y: auto;", grid-list-md)
        v-layout(row, wrap)
            v-flex(v-for="(item, i) in items", :key="i", xs4)
                v-card.pa-3(outlined, draggable, @dragstart="dragstart($event, item.id)")
                    div.d-flex.flex-column.justify-space-around.text-center
                        div
                            v-progress-circular(v-if="item.loading", indeterminate, color="primary")
                            v-icon(v-else) {{ getIconByType(item.type) }}
                        .caption {{ item.name }}

    input(ref="fileinput", type="file", @change="loadAudio", style="display: none;")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { AudioFile, GraphLibraryItem, LibraryItemType } from "@/entities/library";
import globalState from "@/entities/globalState";

@Component
export default class Library extends Vue {

    globalState = globalState;

    get items() {
        return this.globalState.library;
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
        this.globalState.library.push(item);
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
            default:
                return "note";
        }
    }

    public addGraph() {
        this.globalState.library.push(new GraphLibraryItem());
    }

}
</script>