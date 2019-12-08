import { NodeBuilder } from "@baklavajs/core";

export const BooleanNode = new NodeBuilder("BooleanNode")
    .addInputInterface("Value 1", "NumberOption", 0, { type: "number" })
    .addInputInterface("Value 2", "NumberOption", 0, { type: "number" })
    .addInputInterface("Round", "CheckboxOption", false, { type: "boolean" })
    .addInputInterface("Invert", "CheckboxOption", false, { type: "boolean" })
    .addOption("Operation", "SelectOption", () => ({ selected: "==", items: ["==", ">", "<", ">=", "<="] }))
    .addOutputInterface("Output", { type: "boolean" })
    .build();
