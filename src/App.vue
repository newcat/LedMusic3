<template lang="pug">
v-app
    v-content
        #app-container
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
import { globalState } from "@/entities/globalState";
import { globalProcessor } from "@/processing";

import { ipcRenderer, remote } from "electron";
import { readFile, writeFile } from "fs";
import { promisify } from "util";

@Component({
    components: { CLibrary, CTimeline, CGraph, CSettings }
})
export default class App extends Vue {

    showSettings = false;
    projectFilePath = "";

    created() {
        globalState.initialize();
        globalProcessor.initialize();

        ipcRenderer.on("menu:load", () => { this.openLoadDialog(); });
        ipcRenderer.on("menu:save", () => { this.save(); });
        ipcRenderer.on("menu:save_as", () => { this.saveAs(); });
        ipcRenderer.on("menu:settings", () => { this.showSettings = true; });

    }

    async load(ev: any) {
        const p = await this.openLoadDialog();
        if (!p) { return; }
        const buff = await (promisify(readFile)(p));
        globalState.load(buff);
    }

    async save() {
        if (!this.projectFilePath) {
            if (!await this.openSaveDialog()) { return; }
        }
        const state = globalState.save();
        await (promisify(writeFile)(this.projectFilePath, state));
    }

    async saveAs() {
        if (!await this.openSaveDialog()) { return; }
        await this.save();
    }

    private async openLoadDialog(): Promise<string> {
        const dialogResult = await remote.dialog.showOpenDialog({
            title: "Open Project",
            filters: [{ name: "LedMusic Project", extensions: ["lmp"] }]
        });
        if (dialogResult.canceled) { return ""; }
        return dialogResult.filePaths![0];
    }

    private async openSaveDialog() {
        const dialogResult = await remote.dialog.showSaveDialog({
            title: "Save Project",
            filters: [{ name: "LedMusic Project", extensions: ["lmp"] }]
        });
        if (dialogResult.canceled) { return false; }
        this.projectFilePath = dialogResult.filePath!;
        return true;
    }

}
</script>

<style>
#app-container {
    height: 100%;
    width: 100%;
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