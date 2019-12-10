<template lang="pug">
v-app(dark)
    v-content
        v-container.fill-height(fluid)
            div.d-flex.flex-column.fill-height(style="width: 100%;")
                div(style="height:50%;")
                    v-row.fill-height
                        v-col(cols="6")
                            c-library.fill-height
                div(style="height:50%;")
                    c-timeline
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CLibrary from "@/components/Library.vue";
import CTimeline from "@/components/timeline/Timeline.vue";

@Component({
    components: { CLibrary, CTimeline }
})
export default class App extends Vue {}
</script>
