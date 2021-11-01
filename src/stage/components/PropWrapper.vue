<template lang="pug">
.prop(:class="classes", :style="style")
    template(v-for="v in verticalHandles")
        template(v-for="h in horizontalHandles")
            .handle(:class="[v, h]", @pointerdown="onPointerDown($event, v, h)")
    .handle.rotation(@pointerdown="onPointerDownRotation")
    component(:is="propComponent", @pointerdown.native="onPointerDown($event, 'm', 'c')")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Prop as PropModel, propList } from "../props";

type VerticalHandle = "t" | "m" | "b";
type HorizontalHandle = "l" | "c" | "r";

interface DragData {
    v?: VerticalHandle;
    h?: HorizontalHandle;
    rotation: boolean;
    startX: number;
    startY: number;
}

@Component
export default class PropWrapper extends Vue {
    @Prop({ type: Boolean })
    selected!: boolean;

    @Prop()
    prop!: PropModel;

    verticalHandles: VerticalHandle[] = ["t", "m", "b"];
    horizontalHandles: HorizontalHandle[] = ["l", "c", "r"];

    dragData: DragData | null = null;

    boundPointerMove = this.onPointerMove.bind(this);
    boundPointerUp = this.onPointerUp.bind(this);

    get classes() {
        console.log(this.selected);
        return {
            "--selected": this.selected,
        };
    }

    get style() {
        return {
            transform: `translate(${this.prop.x}px, ${this.prop.y}px) rotate(${this.prop.rotation}deg)`,
            width: `${this.prop.width}px`,
            height: `${this.prop.height}px`,
        };
    }

    get propComponent() {
        return propList.find((p) => p.type === this.prop.type)?.component;
    }

    onPointerDown(ev: PointerEvent, v: VerticalHandle, h: HorizontalHandle) {
        this.dragData = {
            v,
            h,
            rotation: false,
            startX: ev.screenX,
            startY: ev.screenY,
        };
        document.addEventListener("pointermove", this.boundPointerMove);
        document.addEventListener("pointerup", this.boundPointerUp);
    }

    onPointerDownRotation(ev: PointerEvent) {
        this.dragData = {
            rotation: true,
            startX: ev.screenX,
            startY: ev.screenY,
        };
        document.addEventListener("pointermove", this.boundPointerMove);
        document.addEventListener("pointerup", this.boundPointerUp);
    }

    onPointerUp() {
        this.dragData = null;
        document.removeEventListener("pointermove", this.boundPointerMove);
        document.removeEventListener("pointerup", this.boundPointerUp);
    }

    onPointerMove(ev: PointerEvent) {
        if (!this.dragData) {
            return;
        }

        const dy = ev.screenY - this.dragData.startY;
        if (this.dragData.v === "t") {
            this.prop.y += dy;
            this.prop.height -= dy;
            this.dragData.startY = ev.screenY;
        } else if (this.dragData.v === "b") {
            this.prop.height += dy;
            this.dragData.startY = ev.screenY;
        }

        const dx = ev.screenX - this.dragData.startX;
        if (this.dragData.h === "l") {
            this.prop.x += dx;
            this.prop.width -= dx;
            this.dragData.startX = ev.screenX;
        } else if (this.dragData.h === "r") {
            this.prop.width += dx;
            this.dragData.startX = ev.screenX;
        }

        if (this.dragData.v === "m" && this.dragData.h === "c") {
            this.prop.x += dx;
            this.prop.y += dy;
            this.dragData.startX = ev.screenX;
            this.dragData.startY = ev.screenY;
        }

        if (this.dragData.rotation) {
            this.prop.rotation += dx;
            this.dragData.startX = ev.screenX;
            this.dragData.startY = ev.screenY;
        }
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

        transition: opacity 0.3s linear, background-color 0.1s linear;

        &:hover {
            background-color: lighten($color-primary, 10%);
        }

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

        &.rotation {
            top: -30px;
            left: 50%;
        }
    }

    &.--selected .handle {
        display: block;
        opacity: 1;
    }
}
</style>
