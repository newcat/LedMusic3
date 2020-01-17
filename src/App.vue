<template lang="pug">
v-app
    v-content
        #app-container
            .mb-2.flex-shrink-1
                v-toolbar(dense, color="surface")
                    v-toolbar-title LedMusic
                    v-spacer
                    v-btn(icon, @click="showSettings = true")
                        v-icon settings_applications
                    v-btn(icon, @click="save")
                        v-icon save
                    v-btn(icon, @click="openLoadDialog")
                        v-icon unarchive
            .flex-grow-1
                split-pane(split="horizontal")
                    template(slot="paneL")
                        split-pane(split="vertical")
                            template(slot="paneL")
                                c-library.fill-height
                            template(slot="paneR")
                                c-graph.fill-height
                    template(slot="paneR")
                        c-timeline
    input(ref="fileinput", type="file", accept=".lmp" @change="load", style="display: none;")
    c-settings(v-model="showSettings")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CLibrary from "@/components/Library.vue";
import CTimeline from "@/components/timeline/Timeline.vue";
import CGraph from "@/components/Graph.vue";
import CSettings from "@/components/Settings.vue";
import { BaklavaEditor } from "@/editors/graph";
import globalState from "@/entities/globalState";

@Component({
    components: { CLibrary, CTimeline, CGraph, CSettings }
})
export default class App extends Vue {

    showSettings = false;

    save() {
        const state = globalState.save();
        const blob = new Blob([state], { type: "application/octet-stream" });
        const a = document.createElement("a");
        a.download = "project.lmp";
        a.href = window.URL.createObjectURL(blob);
        a.click();
    }

    public openLoadDialog() {
        (this.$refs.fileinput as HTMLElement).click();
    }

    async load(ev: any) {
        const f = ev.target.files[0] as File;
        if (!f) { return; }
        const reader = new FileReader();
        const buff = await new Promise<ArrayBuffer>((res) => {
            reader.onload = (e) => res(e.target!.result as ArrayBuffer);
            reader.readAsArrayBuffer(f);
        });
        globalState.load(Buffer.from(buff));
    }

}
</script>

<style>
#app-container {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
}

.content-container {
    margin: 5px;
}

html, body {
    margin: 0;
    padding: 0;
    width: calc(100vw - (100vw - 100%));
    height: 100vh;
}
</style>