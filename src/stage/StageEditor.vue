<template lang="pug">
.stage-editor
        span Test
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class StageEditor extends Vue {}
</script>

<style lang="scss" scoped>
.stage-editor {
    width: 100%;
    height: 100%;
}
</style>
