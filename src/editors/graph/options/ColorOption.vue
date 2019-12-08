<template lang="pug">
.color-option
    .__name {{ name }}
    .__color
        d-color-picker(:value="color" @input="setColor")
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import ColorPicker from "@/components/ColorPicker.vue";
import chroma, { Color } from "chroma-js";

@Component({
    components: {
        "d-color-picker": ColorPicker
    }
})
export default class ColorOption extends Vue {

    @Prop()
    name!: any;

    @Prop()
    value!: Color;

    get color() {
        if (!this.value) {
            return "#000000";
        } else {
            return this.value.css();
        }
    }

    setColor(color: string) {
        this.$emit("input", chroma(color));
    }

}
</script>

<style lang="scss" scoped>
.color-option {
    display: flex;

    & > .__name {
       flex-grow: 1 
    }

    & > .__color {
        width: 60px;
    }

}
</style>
