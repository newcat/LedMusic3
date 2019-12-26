import { ILibraryItem, LibraryItemType } from "./libraryItem";
import uuidv4 from "uuid/v4";
import { TICKS_PER_BEAT } from "@/constants";

export type AutomationPointType = "linear"|"step";

export interface IAutomationPoint {
    unit: number;
    value: number;
    type: AutomationPointType;
}

export class AutomationClip implements ILibraryItem {

    public readonly id = uuidv4();
    public type = LibraryItemType.AUTOMATION_CLIP;
    public name = "Automation Clip";
    public loading = false;

    public points: IAutomationPoint[] = [
        { unit: 0, value: 0.5, type: "linear" },
        { unit: TICKS_PER_BEAT * 4, value: 0.5, type: "linear" }
    ];

}
