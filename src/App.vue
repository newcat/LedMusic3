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
    height: 100vh;
    width: 100vw;
}

.content-container {
    margin: 5px;
}

html, body {
    margin: 0;
    padding: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}
</style>