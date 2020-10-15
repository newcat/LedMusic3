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

    v-treeview(
        :active="!!activeItem ? [activeItem.id] : []",
        :items="items",
        @update:active="onActiveItemChanged"
        open-all,
        open-on-click,
        activatable)

        template(v-slot:prepend="{ item }")
            v-progress-circular(v-if="item.loading", :size="24", :width="2" indeterminate, color="primary")
            v-icon(v-else-if="item.error") warning
            v-icon(v-else) {{ item.icon || getIcon(item.type) }}

        template(v-slot:label="{ item }")
            .v-treeview-node__label(
                :draggable="!item.id.startsWith('_folder')",
                @dragstart="dragstart($event, item.id)")
                    | {{ item.name }}

        template(v-slot:append="{ item }")
            div(v-if="activeItem && activeItem.id === item.id")
                v-btn(icon, @click.stop="settingsOpen = true")
                    v-icon edit
                v-btn(icon, @click.stop="deleteItem(item.id)")
                    v-icon delete

    input(ref="fileinput", type="file", @change="loadAudio", style="display: none;")
    item-settings(v-model="settingsOpen", :item="activeItem")
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { AudioLibraryItem } from "@/audio";
import { AutomationLibraryItem } from "@/automation";
import { GraphLibraryItem } from "@/graph";
import { PatternLibraryItem } from "@/pattern";
import { LibraryItemType, LibraryItem } from "@/library";
import { globalState } from "@/globalState";
import ItemSettings from "./LibraryItemSettings.vue";

interface ITreeNode {
    id: string;
    name: string;
    icon?: string;
    children?: ITreeNode[];
    loading?: boolean;
    error?: boolean;
    type?: LibraryItemType;
}

@Component({
    components: { ItemSettings },
})
export default class Library extends Vue {
    globalState = globalState;
    settingsOpen = false;
    settingsItem: LibraryItem | null = null;
    activeItem: LibraryItem | null = null;

    get items() {
        const audioFiles: ITreeNode = { id: "_folder_af", name: "Audio Files", icon: "library_music", children: [] };
        const graphs: ITreeNode = { id: "_folder_graphs", name: "Graphs", icon: "device_hub", children: [] };
        const automationClips: ITreeNode = {
            id: "_folder_ac",
            name: "Automation Clips",
            icon: "timeline",
            children: [],
        };
        const notePatterns: ITreeNode = { id: "_folder_np", name: "Note Patterns", icon: "queue_music", children: [] };
        this.globalState.library.items.forEach((item) => {
            const itemData = {
                id: item.id,
                name: item.name,
                type: item.type,
                loading: item.loading,
                error: item.error,
            };
            switch (item.type) {
                case LibraryItemType.AUDIO:
                    audioFiles.children!.push(itemData);
                    break;
                case LibraryItemType.GRAPH:
                    graphs.children!.push(itemData);
                    break;
                case LibraryItemType.AUTOMATION:
                    automationClips.children!.push(itemData);
                    break;
                case LibraryItemType.PATTERN:
                    notePatterns.children!.push(itemData);
                    break;
            }
        });
        return [audioFiles, graphs, automationClips, notePatterns];
    }

    public onActiveItemChanged(newActiveItems: string[]) {
        if (newActiveItems.length === 0 || newActiveItems[0].startsWith("_folder")) {
            this.activeItem = null;
        } else {
            this.activeItem = this.globalState.library.getItemById(newActiveItems[0]) ?? null;
        }
        this.$emit("item-selected", this.activeItem);
    }

    public openFileDialog() {
        (this.$refs.fileinput as HTMLElement).click();
    }

    public async loadAudio() {
        const f = (this.$refs.fileinput as HTMLInputElement).files;
        if (!f || f.length === 0) {
            return;
        }
        const item = new AudioLibraryItem();
        item.name = f[0].name;
        item.path = f[0].path;
        this.globalState.library.addItem(item);
        await item.load();
    }

    public dragstart(ev: DragEvent, itemId: string) {
        ev.dataTransfer!.setData("id", itemId);
    }

    public getIcon(type: LibraryItemType) {
        switch (type) {
            case LibraryItemType.AUDIO:
                return "library_music";
            case LibraryItemType.GRAPH:
                return "device_hub";
            case LibraryItemType.AUTOMATION:
                return "timeline";
            case LibraryItemType.PATTERN:
                return "queue_music";
            default:
                return "note";
        }
    }

    public addGraph() {
        this.globalState.library.addItem(new GraphLibraryItem());
    }

    public addAutomationClip() {
        this.globalState.library.addItem(new AutomationLibraryItem());
    }

    public addNotePattern() {
        this.globalState.library.addItem(new PatternLibraryItem());
    }

    public deleteItem(id: string) {
        this.globalState.library.removeItem(this.globalState.library.getItemById(id)!);
    }
}
</script>
