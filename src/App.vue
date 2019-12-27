<template lang="pug">
v-app
    v-content
        #app-container
            #top-left.content-container
                c-library.fill-height
            #top-right.content-container
                // c-graph.fill-height
                c-automation.fill-height
            #bottom.content-container
                c-timeline
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CLibrary from "@/components/Library.vue";
import CTimeline from "@/components/timeline/Timeline.vue";
import CGraph from "@/components/Graph.vue";
import CAutomation from "@/components/automation/AutomationEditor.vue";
import { BaklavaEditor } from "@/editors/graph";
import globalState from "@/entities/globalState";

@Component({
    components: { CLibrary, CTimeline, CGraph, CAutomation }
})
export default class App extends Vue {}
</script>

<style>
#app-container {
    display: grid;
    grid-template-rows: 50vh 50vh;
    grid-template-columns: 50vw 50vw;
    height: 100%;
    width: 100%;
    padding: 5px;
}

.content-container {
    padding: 5px;
}

#top-left {
    grid-column: 1 / span 1;
    grid-row: 1 / span 1;
}

#top-right {
    grid-column: 2 / span 1;
    grid-row: 1 / span 1;
}

#bottom {
    grid-column: 1 / span 2;
    grid-row: 2 / span 1;
}
</style>