import { Item, EventBus, PositionCalculator } from "@/lokumjs";
import { Graphics } from "pixi.js";
import { AutomationClip, ILibraryItem, LibraryItemType, IAutomationPoint } from "@/entities/library";

function getCoordinates(p: IAutomationPoint, pc: PositionCalculator, height: number) {
    const x = p.unit * pc.unitWidth;
    const y = height * (1 - p.value);
    return { x, y };
}

export default function renderAutomationClip(
    item: Item, graphics: Graphics, width: number, height: number, eventBus: EventBus, positionCalculator: PositionCalculator) {

    if (item.data && item.data.libraryItem) {
        const libraryItem = item.data.libraryItem as ILibraryItem;
        if (libraryItem.type === LibraryItemType.AUTOMATION_CLIP && !libraryItem.loading) {

            if (item.data.renderedWidth === width && item.data.renderedHeight === height) {
                return;
            }

            const points = (libraryItem as AutomationClip).points;
            const initialRender = item.data.renderedWidth === undefined;

            if (initialRender) {
                item.data.automationGraphics = new Graphics();
                item.data.clipGraphics = new Graphics();
                item.data.automationGraphics.addChild(item.data.clipGraphics);
                item.data.automationGraphics.mask = item.data.clipGraphics;
                graphics.addChild(item.data.automationGraphics);
                // todo subscribe events
            }

            const cg = item.data.clipGraphics as Graphics;
            cg.clear().beginFill(0xffffff).drawRect(0, 0, width, height).endFill();

            const g = item.data.automationGraphics as Graphics;
            g.clear();

            g.lineStyle(1, 0xffffff);
            points.forEach((p, i) => {
                const { x, y } = getCoordinates(p, positionCalculator, height);
                if (i === 0) {
                    g.moveTo(x, y);
                } else {
                    g.lineTo(x, y);
                }
            });

            g.lineStyle().beginFill(0xffffff);
            points.forEach((p) => {
                const { x, y } = getCoordinates(p, positionCalculator, height);
                g.drawCircle(x, y, 3);
            });

            item.data.renderedWidth = width;
            item.data.renderedHeight = height;

        }
    }
}
