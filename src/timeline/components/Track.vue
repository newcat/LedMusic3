<template lang="pug">
.__track
    .__header
        .__title {{ track.name }}
        .__actions
            v-btn(icon, x-small, @click="settingsOpen = true")
                v-icon create
            v-btn(icon, x-small)
                v-icon keyboard_arrow_up
            v-btn(icon, x-small)
                v-icon keyboard_arrow_down

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
import { Track, Item } from "../model";
import TimelineItem from "./TimelineItem.vue";
import TrackSettings from "./TrackSettings.vue";

@Component({
    components: { TimelineItem, TrackSettings },
})
export default class TrackView extends Vue {
    @Prop()
    track!: Track;

    @Prop()
    items!: Item[];

    @Prop()
    unitWidth!: number;

    settingsOpen = false;
}
</script>
