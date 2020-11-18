<template lang="pug">
.__track
    .__header
        .__title {{ track.name }}
        .__actions(v-if="confirmRemove")
            .text-caption Remove?
            v-btn(text, x-small, @click="remove") Yes
            v-btn(text, x-small, @click="confirmRemove = false") No
        .__actions(v-else)
            v-btn(icon, x-small, @click="settingsOpen = true")
                v-icon create
            v-btn(icon, x-small, @click="moveUp")
                v-icon keyboard_arrow_up
            v-btn(icon, x-small, @click="moveDown")
                v-icon keyboard_arrow_down
            v-btn(icon, x-small, @click="confirmRemove = true")
                v-icon close

    .__item-container(
        @mouseenter="$emit('mouseenter', $event)",
        @mouseleave="$emit('mouseleave', $event)"
        @mousemove="$emit('mousemove', $event)")

        timeline-item(
            v-for="item in items",
            :key="item.id", :item="item",
            :unitWidth="unitWidth",
            @drag-start="$listeners['drag-start']")

    track-settings(v-model="settingsOpen", :track="track")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Track, Item, TimelineEditor } from "../model";
import TimelineItem from "./TimelineItem.vue";
import TrackSettings from "./TrackSettings.vue";

@Component({
    components: { TimelineItem, TrackSettings },
})
export default class TrackView extends Vue {
    @Prop()
    editor!: TimelineEditor;

    @Prop()
    track!: Track;

    @Prop()
    unitWidth!: number;

    get items(): Item[] {
        return this.editor ? this.editor.items.filter((i) => i.trackId === this.track.id) : [];
    }

    moveUp() {
        this.editor.moveTrack(this.track, "up");
    }

    moveDown() {
        this.editor.moveTrack(this.track, "down");
    }

    remove() {
        this.items.forEach((i) => this.editor.removeItem(i));
        this.editor.removeTrack(this.track);
    }

    settingsOpen = false;
    confirmRemove = false;
}
</script>
