<template lang="pug">
v-card.d-flex.flex-column(flat)
    v-toolbar(dense, flat, style="max-height: 48px;")
        v-toolbar-title Piano Roll
    .pianoroll
        .__row(v-for="i in 128", :key="i")
            .__header
                div {{ i }}
            .__content
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class Pianoroll extends Vue {

    

}
</script>

<style lang="scss">
.pianoroll {
    overflow-y: scroll;
    width: 100%;

    $rowHeight: 30px;
    $headerWidth: 50px;

    .__row {
        position: relative;
        height: $rowHeight;
        border-bottom: 1px solid #504f5c;

        .__header {
            position: sticky;
            left: 0;
            width: $headerWidth;
            height: 100%;
            background-color: #33333d;
            color: #bbb;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .__content {
            margin-left: $headerWidth;
            width: 1000px;
            height: 100%;
        }

    }

}
</style>