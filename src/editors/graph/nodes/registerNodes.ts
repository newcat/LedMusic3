import { Editor } from "@baklavajs/core";

import * as AudioNodes from "./audio";
import * as ColorNodes from "./colors";
import * as ConverterNodes from "./converters";
import * as GeneratorNodes from "./generators";
import * as OutputNodes from "./output";

import { AutomationNode } from "./AutomationNode";

function registerCategory(editor: Editor, nodes: any, category?: string) {
    for (const k of Object.keys(nodes)) {
        editor.registerNodeType(k, nodes[k], category);
    }
}

export function registerNodes(editor: Editor) {
    registerCategory(editor, AudioNodes, "Audio");
    registerCategory(editor, ColorNodes, "Colors");
    registerCategory(editor, ConverterNodes, "Converters");
    registerCategory(editor, GeneratorNodes, "Generators");
    registerCategory(editor, OutputNodes, "Outputs");
    editor.registerNodeType("AutomationNode", AutomationNode);
}
