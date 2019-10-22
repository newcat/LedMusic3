<template>
    <baklava-editor :plugin="viewPlugin"></baklava-editor>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import chroma from "chroma-js";

import { Editor } from "@baklavajs/core";
import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";
import { InterfaceTypePlugin } from "@baklavajs/plugin-interface-types";
import { OptionPlugin, NumberOption } from "@baklavajs/plugin-options-vue";
import { Engine } from "@baklavajs/plugin-engine";

import { registerNodes } from "@/nodes/registerNodes";
import { registerOptions } from "@/options/registerOptions";
import GlobalProperties from "@/GlobalProperties";

@Component
export default class App extends Vue {

    public editor = new Editor();
    public viewPlugin = new ViewPlugin();
    public intfTypePlugin = new InterfaceTypePlugin();
    public enginePlugin = new Engine(false);

    public created() {

        this.editor.use(this.enginePlugin);
        this.editor.use(this.viewPlugin);
        this.editor.use(this.intfTypePlugin);
        this.editor.use(new OptionPlugin());

        registerNodes(this.editor);
        registerOptions(this.viewPlugin);

        this.intfTypePlugin.addType("boolean", "darkcyan");
        this.intfTypePlugin.addType("color_single", "gold");
        this.intfTypePlugin.addType("color_array", "coral");
        this.intfTypePlugin.addType("number", "gray");
        this.intfTypePlugin.addType("positions", "lightblue");

        this.intfTypePlugin.addConversion("number", "boolean");
        this.intfTypePlugin.addConversion("number", "color_single", (v) => chroma(v, v, v));
        this.intfTypePlugin.addConversion("number", "color_array", (v) => [chroma(v, v, v)]);
        this.intfTypePlugin.addConversion("boolean", "number");

        setInterval(() => {
            this.enginePlugin.calculate();
        }, 1000 / GlobalProperties.fps);

    }

}
</script>
