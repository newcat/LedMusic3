<template>
<div
    :class="['dark-select', { '--open': open }]"
    @click="open = !open"
    v-click-outside="() => { open = false; }"
>
    <div class="__selected">
        <div class="__text">{{ selected ? selected.text : "" }}</div>
        <div class="__icon">
            <i-arrow></i-arrow>
        </div>
    </div>
    <transition name="slide-fade">
        <div class="__dropdown" v-show="open">
            <div class="item --header">{{ label }}</div>
            <div
                v-for="item in items"
                :key="item.value"
                :class="['item', { '--active': value.value === item.value }]"
                @click="setSelected(item)"
            >{{ item.text }}</div>
        </div>
    </transition>
</div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from "vue-property-decorator";
import Arrow from "./Arrow.vue";
// @ts-ignore
import ClickOutside from "v-click-outside";

interface IItemType {
    value: string;
    text: string;
}

@Component({
    components: {
        "i-arrow": Arrow
    },
    directives: {
        ClickOutside: ClickOutside.directive
    }
})
export default class SelectOption extends Vue {

    open = false;

    @Prop({ type: String })
    label!: string;

    @Prop({ type: String })
    value!: string;

    @Prop({ type: Array })
    items!: IItemType[];

    get selected() {
        return this.items.find((i) => i.value === this.value);
    }

    setSelected(item: IItemType) {
        this.$emit("input", item.value);
    }

}
</script>