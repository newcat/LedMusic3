<template lang="pug">
v-card
    v-toolbar(dense)
        v-toolbar-title Library
        v-spacer
        v-btn(icon)
            v-icon(@click="openFileDialog") add

    v-container(fluid, style="overflow-y: auto;")
        v-row
            v-col(v-for="(item, i) in items", :key="i", cols="3")
                v-hover(v-slot:default="{ hover }")
                    v-card.pa-3(outlined, style="height:100%;")
                        div.d-flex.flex-column.justify-space-around.text-center(style="height:100%;")
                            div
                                v-progress-circular(v-if="item.loading", indeterminate, color="primary")
                                v-icon(v-else) library_music
                            .caption {{ item.name }}

    input(ref="fileinput", type="file", @change="loadAudio", style="display: none;")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { AudioFile } from "@/entities/library/audioFile";
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

}
</script>