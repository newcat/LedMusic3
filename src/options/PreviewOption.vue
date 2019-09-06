<template>
<div class="preview-option" :style="{ background: gradient }"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Color } from "chroma-js";

@Component
export default class PreviewOption extends Vue {

    @Prop({})
    public value!: Color[];

    get gradient() {
        if (this.value && this.value.length > 0) {
            if (this.value.length > 1) {
                return `linear-gradient(to right, ${this.value.map((c) => c.css()).join(",")})`;
            } else {
                return this.value[0].css();
            }
        } else {
            return "black";
        }
    }

}
</script>

<style>
.preview-option {
    width: 100%;
    height: 1.5rem;
}
</style>