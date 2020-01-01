import { serialize, deserialize } from "bson";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
import uuidv4 from "uuid/v4";
import { TICKS_PER_BEAT } from "@/constants";

export type AutomationPointType = "linear"|"step";

export interface IAutomationPoint {
    id: string;
    unit: number;
    value: number;
    type: AutomationPointType;
}

export class AutomationClip implements ILibraryItem {

    public static deserialize(data: Buffer) {
        const { id, name, points } = deserialize(data);
        const ac = new AutomationClip(name, points);
        ac.id = id;
        return ac;
    }

    public id = uuidv4();
    public type = LibraryItemType.AUTOMATION_CLIP;
    public name: string;
    public loading = false;

    public points: IAutomationPoint[];

    public constructor(name = "Automation Clip", points?: IAutomationPoint[]) {
        this.name = name;
        this.points = points || [
            { id: uuidv4(), unit: 0, value: 0.5, type: "linear" },
            { id: uuidv4(), unit: TICKS_PER_BEAT * 4, value: 0.5, type: "linear" }
        ];
    }

    public addPoint(unit: number, value: number, type: AutomationPointType = "linear") {
        this.points.push({ id: uuidv4(), unit, value, type });
        this.sortPoints();
    }

    public sortPoints() {
        this.points.sort((a, b) => a.unit - b.unit);
    }

    public getValueAt(unit: number) {
        for (let i = this.points.length - 1; i >= 0; i--) {

            const p  = this.points[i];
            if (p.unit > unit) { continue; }
            const firstPoint = this.points[i];

            if (i + 1 >= this.points.length) {
                // this is the last point we have, therefore return its value
                return firstPoint.value;
            }

            const secondPoint = this.points[i + 1];

            switch (secondPoint.type) {
                case "linear":
                    return this.linearInterpolation(unit, firstPoint, secondPoint);
                case "step":
                    return firstPoint.value;
            }

        }
        return 0;

    }

    public serialize() {
        return serialize({
            id: this.id,
            type: this.type,
            name: this.name,
            points: this.points,
        });
    }

    private linearInterpolation(unit: number, a: IAutomationPoint, b: IAutomationPoint) {
        const diff = b.unit - a.unit;
        if (diff === 0) { return b.value; }
        return a.value + (b.value - a.value) * ((unit - a.unit) / diff);
    }

}
