<template lang="pug">
v-app(dark)
    v-content
        v-container.fill-height(fluid)
            div.d-flex.flex-column.fill-height(style="width: 100%;")
                div.flex-grow-1
                    v-row
                        v-col(cols="6")
                            c-library
                div.flex-grow-1 Test
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { BaklavaEditor } from "./editors/graph";

import CLibrary from "@/components/Library.vue";

@Component({
    components: { CLibrary }
})
export default class App extends Vue {

    public editor = new BaklavaEditor();

}
</script>
