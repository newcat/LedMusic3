<template lang="pug">
v-app
    v-content
        v-container.fill-height(fluid)
            div.d-flex.flex-column.fill-height(style="width: 100%;")
                div(style="height:50%;")
                    v-row.fill-height
                        v-col(cols="6")
                            c-library.fill-height
                        v-col(colr="6")
                            baklava-editor(:plugin="graph.viewPlugin")
                div(style="height:50%;")
                    c-timeline
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import CLibrary from "@/components/Library.vue";
import CTimeline from "@/components/timeline/Timeline.vue";
import { BaklavaEditor } from "@/editors/graph";
import globalState from "@/entities/globalState";

@Component({
    components: { CLibrary, CTimeline }
})
export default class App extends Vue {

    graph = new BaklavaEditor();

}
</script>
