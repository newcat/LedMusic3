<template lang="pug">
.prop(:class="classes", :style="style")
    .handle.t.l
    .handle.t.c
    .handle.t.r
    .handle.m.l
    .handle.m.r
    .handle.b.l
    .handle.b.c
    .handle.b.r
    component(:is="propComponent")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Prop as PropModel, propList } from "../props";

@Component
export default class PropWrapper extends Vue {
    @Prop({ type: Boolean })
    selected!: boolean;

    @Prop()
    prop!: PropModel;

    get classes() {
        console.log(this.selected);
        return {
            "--selected": this.selected,
        };
    }

    get style() {
        return {
            transform: `translate(${this.prop.x}px, ${this.prop.y}px) rotate(${this.prop.rotation})`,
            width: `${this.prop.width}px`,
            height: `${this.prop.height}px`,
        };
    }

    get propComponent() {
        return propList.find((p) => p.type === this.prop.type)?.component;
    }
}
</script>

<style lang="scss" scoped>
.prop {
    $color-primary: #1eb980;

    position: relative;
    border-width: 2px;
    border-style: solid;
    border-color: transparent;

    transition: border-color 0.3s linear;

    &:hover:not(.--selected) {
        border-color: scale-color($color-primary, $alpha: -50%);
    }

    &.--selected {
        border-color: $color-primary;
    }

    .handle {
        position: absolute;
        width: 10px;
        height: 10px;
        transform: translate(-50%, -50%);
        opacity: 0;
        background-color: $color-primary;

        transition: opacity 0.3s linear;

        &.t {
            top: 0;
        }

        &.m {
            top: 50%;
        }

        &.b {
            top: 100%;
        }

        &.l {
            left: 0;
        }

        &.c {
            left: 50%;
        }

        &.r {
            left: 100%;
        }
    }

    &.--selected .handle {
        display: block;
        opacity: 1;
    }
}
</style>
