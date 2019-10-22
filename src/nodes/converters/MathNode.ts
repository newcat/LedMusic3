import { NodeBuilder } from "@baklavajs/core";

export const MathNode = new NodeBuilder("MathNode")
    .addInputInterface("Value 1", "NumberOption", 0, { type: "number" })
    .addInputInterface("Value 2", "NumberOption", 0, { type: "number" })
    .addInputInterface("Clamp", "CheckboxOption", false, { type: "boolean" })
    .addOption("Operation", "SelectOption", "Add", undefined, { items: [
        "Add", "Subtract", "Multiply", "Divide", "Sine", "Cosine", "Tangent", "Arcsine", "Arccosine",
        "Arctangent", "Power", "Logarithm", "Minimum", "Maximum", "Round", "Modulo", "Absolute"
    ]})
    .addOutputInterface("Output", { type: "number" })
    .build();
