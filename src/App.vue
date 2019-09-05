<template>
    <baklava-editor :plugin="viewPlugin"></baklava-editor>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { Editor } from "@baklavajs/core";
import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";
import { InterfaceTypePlugin } from "@baklavajs/plugin-interface-types";
import { OptionPlugin } from "@baklavajs/plugin-options-vue";

import { registerNodes } from "@/nodes/registerNodes";

@Component
export default class App extends Vue {

    public editor = new Editor();
    public viewPlugin = new ViewPlugin();
    public intfTypePlugin = new InterfaceTypePlugin();

    public created() {

        this.editor.use(this.viewPlugin);
        this.editor.use(this.intfTypePlugin);
        this.editor.use(new OptionPlugin());

        registerNodes(this.editor);

        this.intfTypePlugin.addType("boolean", "darkcyan");
        this.intfTypePlugin.addType("color_single", "gold");
        this.intfTypePlugin.addType("color_array", "coral");
        this.intfTypePlugin.addType("number", "gray");

        this.intfTypePlugin.addConversion("number", "bool");
        this.intfTypePlugin.addConversion("number", "color_single");
        this.intfTypePlugin.addConversion("number", "color_array");
        this.intfTypePlugin.addConversion("bool", "number");


    }

}
</script>
