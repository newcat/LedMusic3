import { Editor } from "@baklavajs/core";

import DotNode from "./generators/DotNode";

export function registerNodes(editor: Editor) {
    editor.registerNodeType("DotNode", DotNode);
}
