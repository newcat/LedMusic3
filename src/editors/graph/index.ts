import { Editor } from "@baklavajs/core";
import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";
import { InterfaceTypePlugin } from "@baklavajs/plugin-interface-types";
import { OptionPlugin, NumberOption } from "@baklavajs/plugin-options-vue";
import { Engine } from "@baklavajs/plugin-engine";

import chroma from "chroma-js";

import { registerNodes } from "./nodes/registerNodes";
import { registerOptions } from "./options/registerOptions";

export class BaklavaEditor extends Editor {

    public viewPlugin = new ViewPlugin();
    public intfTypePlugin = new InterfaceTypePlugin();
    public enginePlugin = new Engine(false);

    public constructor() {
        super();

        this.use(this.enginePlugin);
        this.use(this.viewPlugin);
        this.use(this.intfTypePlugin);
        this.use(new OptionPlugin());

        registerNodes(this);
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
    }

}
