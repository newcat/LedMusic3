<template lang="pug">
v-app
    v-main
        #app-container
            c-toolbar(
                @newProject="newProject",
                @load="load",
                @save="save",
                @saveAs="saveAs",
                @showSettings="showSettings = true"
            )
            split-pane(split="vertical", :min-percent='10', :default-percent='20')
                template(slot="paneL")
                    c-library.fill-height(@item-selected="onItemSelected")
                template(slot="paneR")
                    split-pane(split="horizontal")
                        template(slot="paneL")
                            c-unified-editor(:selectedItemId="selectedLibraryItemId").fill-height
                        template(slot="paneR")
                            c-timeline
    c-settings(v-model="showSettings")
    c-loading-dialog(v-model="showLoadingDialog")
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { remote } from "electron";
import { readFile, writeFile } from "fs";
import { promisify } from "util";

import CLibrary from "@/components/Library.vue";
import CSettings from "@/components/Settings.vue";
import CToolbar from "@/components/Toolbar.vue";
import CLoadingDialog from "@/components/LoadingDialog.vue";
import CUnifiedEditor from "@/components/UnifiedEditor.vue";
import CTimeline from "@/timeline/Timeline.vue";

import { globalState } from "@/globalState";
import type { LibraryItem } from "@/library";
import { TimelineProcessor } from "@/timeline";

const readFileP = promisify(readFile);
const writeFileP = promisify(writeFile);

@Component({
    components: { CLibrary, CTimeline, CUnifiedEditor, CSettings, CToolbar, CLoadingDialog },
})
export default class App extends Vue {
    showSettings = false;
    showLoadingDialog = false;
    selectedLibraryItemId = "";
    processor = new TimelineProcessor();

    created(): void {
        this.processor.initialize();
        this.newProject();
    }

    newProject(): void {
        globalState.reset();
    }

    onItemSelected(item: LibraryItem | undefined) {
        if (item) {
            this.selectedLibraryItemId = item.id;
        } else {
            this.selectedLibraryItemId = "";
        }
    }

    async load(): Promise<void> {
        const p = await this.openLoadDialog();
        if (!p) {
            return;
        }
        const buff = await readFileP(p);
        globalState.reset();
        globalState.projectFilePath = p;
        this.showLoadingDialog = true;
        globalState.load(buff);
    }

    async save(): Promise<void> {
        if (!globalState.projectFilePath) {
            if (!(await this.openSaveDialog())) {
                return;
            }
        }
        const state = globalState.save();
        await writeFileP(globalState.projectFilePath, state);
    }

    async saveAs(): Promise<void> {
        if (!(await this.openSaveDialog())) {
            return;
        }
        await this.save();
    }

    private async openLoadDialog(): Promise<string> {
        const dialogResult = await remote.dialog.showOpenDialog({
            title: "Open Project",
            filters: [{ name: "LedMusic Project", extensions: ["lmp"] }],
        });
        if (dialogResult.canceled) {
            return "";
        }
        return dialogResult.filePaths![0];
    }

    private async openSaveDialog(): Promise<boolean> {
        const dialogResult = await remote.dialog.showSaveDialog({
            title: "Save Project",
            filters: [{ name: "LedMusic Project", extensions: ["lmp"] }],
        });
        if (dialogResult.canceled) {
            return false;
        }
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

html,
body {
    margin: 0;
    padding: 0;
    width: calc(100vw - (100vw - 100%));
    height: 100vh;
}
</style>
