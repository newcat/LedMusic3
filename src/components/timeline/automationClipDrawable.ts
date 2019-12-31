import { Drawable, IItemDrawableProps } from "@/lokumjs";
import { Graphics, Point, interaction } from "pixi.js";
import { AutomationClip, IAutomationPoint } from "@/entities/library";

interface IScreenPoint {
    id: string;
    x: number;
    y: number;
}

export class AutomationClipDrawable extends Drawable<IItemDrawableProps> {

    private clipGraphics = new Graphics();

    private points: IScreenPoint[] = [];
    private hoveredPointId: string = "";
    private dragging = false;

    private lastClickTime = 0; // for detecting double-clicks

    private get libItem() {
        return this.props.item.data!.libraryItem as AutomationClip;
    }

    public setup() {
        this.graphics.addChild(this.clipGraphics);
        this.graphics.mask = this.clipGraphics;
        this.graphics.interactive = true;
        this.viewInstance.eventBus.events.pointermove.subscribe(this.graphics, (ev) => this.onMouseMove(ev.data));
        this.viewInstance.eventBus.events.pointerdown.subscribe(this.graphics, (ev) => this.onMouseDown(ev.data));
        this.viewInstance.eventBus.events.pointerup.subscribe(this.graphics, (ev) => this.onMouseUp());
        this.graphics.addListener("pointerout", () => {
            this.dragging = false;
            this.hoveredPointId = "";
            this.needsRender = true;
        });
    }

    public render() {

        this.clipGraphics.clear().beginFill(0xffffff).drawRect(0, 0, this.props.width, this.props.height).endFill();
        this.graphics.clear().lineStyle(1, 0xffffff);

        const points = (this.props.item.data!.libraryItem as AutomationClip).points;
        this.points = points.map((p) => {
            const { x, y } = this.getCoordinates(p);
            return { x, y, id: p.id };
        });

        this.points.forEach((p, i) => {
            if (i === 0) {
                this.graphics.moveTo(p.x, p.y);
            } else {
                this.graphics.lineTo(p.x, p.y);
            }
        });

        this.graphics.lineStyle().beginFill(0xffffff);
        this.points.forEach((p) => {
            const isHovered = this.hoveredPointId && p.id === this.hoveredPointId;
            this.graphics.drawCircle(p.x, p.y, isHovered ? 6 : 3);
        });

    }

    private getCoordinates(p: IAutomationPoint): Point {
        const x = p.unit * this.viewInstance.positionCalculator.unitWidth;
        const y = this.props.height * (1 - p.value);
        return new Point(x, y);
    }

    private getUnitValue(p: Point) {
        const unit = Math.floor(p.x / this.viewInstance.positionCalculator.unitWidth);
        const value = -(p.y / this.props.height) + 1;
        return { unit, value };
    }

    private onMouseMove(data: interaction.InteractionData) {
        const mousePoint = data.getLocalPosition(this.graphics);
        if (this.dragging && this.hoveredPointId) {
            const point = this.libItem.points.find((p) => p.id === this.hoveredPointId);
            const { unit, value } = this.getUnitValue(mousePoint);
            if (!point) { return; }
            point.unit = unit;
            point.value = value;
            this.libItem.sortPoints();
            this.needsRender = true;
        } else {
            const oldHoveredPointId = this.hoveredPointId;
            const hoveredPoint = this.points.find((p) => Math.pow(mousePoint.x - p.x, 2) + Math.pow(mousePoint.y - p.y, 2) < 25);
            this.hoveredPointId = hoveredPoint?.id ?? "";
            if (this.hoveredPointId !== oldHoveredPointId) { this.needsRender = true; }
        }
    }

    private onMouseDown(data: interaction.InteractionData) {
        if (this.hoveredPointId) {
            this.dragging = true;
            return false;
        } else if (Date.now() - this.lastClickTime < 400) {
            this.addPoint(data.getLocalPosition(this.graphics));
        }
        this.lastClickTime = Date.now();
    }

    private onMouseUp() {
        this.dragging = false;
    }

    private addPoint(localCoords: Point) {
        const { unit, value } = this.getUnitValue(localCoords);
        this.libItem.addPoint(unit, value);
        this.needsRender = true;
    }

}
