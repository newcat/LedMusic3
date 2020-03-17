<template lang="pug">
v-app
    v-content
        #app-container
            c-toolbar(
                @newProject="newProject",
                @load="load",
                @save="save",
                @saveAs="saveAs",
                @showSettings="showSettings = true"
            )
            split-pane(split="horizontal")
                template(slot="paneL")
                    split-pane(split="vertical")
                        template(slot="paneL")
                            c-library.fill-height
                        template(slot="paneR")
                            c-graph.fill-height
                template(slot="paneR")
                    c-timeline
            c-global-preview
    c-settings(v-model="showSettings")
    c-loading-dialog(v-model="showLoadingDialog")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CLibrary from "@/components/Library.vue";
import CTimeline from "@/components/timeline/Timeline.vue";
import CGraph from "@/components/Graph.vue";
import CSettings from "@/components/Settings.vue";
import CToolbar from "@/components/Toolbar.vue";
import CLoadingDialog from "@/components/loading/LoadingDialog.vue";
import CGlobalPreview from "@/components/GlobalPreview.vue";
import { BaklavaEditor } from "@/editors/graph";
import { globalState } from "@/entities/globalState";
import { globalProcessor } from "@/processing";

import { remote } from "electron";
import { readFile, writeFile } from "fs";
import { promisify } from "util";

const readFileP = promisify(readFile);
const writeFileP = promisify(writeFile);

@Component({
    components: { CLibrary, CTimeline, CGraph, CSettings, CToolbar, CLoadingDialog, CGlobalPreview }
})
export default class App extends Vue {

    showSettings = false;
    showLoadingDialog = false;

    created() {
        this.newProject();
    }

    newProject() {
        globalState.reset();
    }

    async load() {
        const p = await this.openLoadDialog();
        if (!p) { return; }
        const buff = await readFileP(p);
        globalState.reset();
        globalState.projectFilePath = p;
        this.showLoadingDialog = true;
        globalState.load(buff);
    }

    async save() {
        if (!globalState.projectFilePath) {
            if (!await this.openSaveDialog()) { return; }
        }
        const state = globalState.save();
        await writeFileP(globalState.projectFilePath, state);
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
        globalState.projectFilePath = dialogResult.filePath!;
        return true;
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