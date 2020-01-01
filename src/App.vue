<template lang="pug">
v-app
    v-content
        #app-container
            #top-left.content-container
                c-library.fill-height
            #top-right.content-container
                c-graph.fill-height
            #bottom.content-container
                c-timeline
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { serialize } from "bson";

import CLibrary from "@/components/Library.vue";
import CTimeline from "@/components/timeline/Timeline.vue";
import CGraph from "@/components/Graph.vue";
import { BaklavaEditor } from "@/editors/graph";
import globalState from "@/entities/globalState";

@Component({
    components: { CLibrary, CTimeline, CGraph }
})
export default class App extends Vue {

    save() {

        const serializedLibrary = serialize(globalState.library.map((i) => i.serialize()));
        const state = serialize({
            scene: globalState.scene,
            timeline: globalState.timeline.save(),
            library: serializedLibrary,
            bpm: globalState.bpm
        });

        const blob = new Blob([state], { type: "application/octet-stream" });
        const a = document.createElement("a");
        a.download = "project.lmp";
        a.href = window.URL.createObjectURL(blob);
        a.click();

    }

}
</script>

<style>
#app-container {
    display: grid;
    grid-template-rows: 50vh 50vh;
    grid-template-columns: 50vw 50vw;
    height: 100vh;
    width: 100vw;
}

.content-container {
    padding: 10px;
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