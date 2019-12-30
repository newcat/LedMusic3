import { Drawable, IItemDrawableProps } from "@/lokumjs";
import { Graphics, Point, interaction } from "pixi.js";
import { AutomationClip, IAutomationPoint } from "@/entities/library";

interface IScreenPoint {
    x: number;
    y: number;
    automationPoint: IAutomationPoint;
}

export class AutomationClipDrawable extends Drawable<IItemDrawableProps> {

    private clipGraphics = new Graphics();

    private points: IScreenPoint[] = [];
    private hoveredPoint: IScreenPoint|null = null;
    private dragging = false;

    public setup() {
        this.graphics.addChild(this.clipGraphics);
        this.graphics.mask = this.clipGraphics;
        this.graphics.interactive = true;
        this.viewInstance.eventBus.events.pointermove.subscribe(this.graphics, (ev) => this.onMouseMove(ev.data));
        this.viewInstance.eventBus.events.pointerdown.subscribe(this.graphics, (ev) => this.onMouseDown(ev.data));
        this.viewInstance.eventBus.events.pointerup.subscribe(this.graphics, (ev) => this.onMouseUp());
    }

    public render() {

        this.clipGraphics.clear().beginFill(0xffffff).drawRect(0, 0, this.props.width, this.props.height).endFill();
        this.graphics.clear().lineStyle(1, 0xffffff);

        const points = (this.props.item.data!.libraryItem as AutomationClip).points;
        this.points = points.map((p) => {
            const { x, y } = this.getCoordinates(p);
            return { x, y, automationPoint: p };
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
            const isHovered = !!this.hoveredPoint && p.x === this.hoveredPoint.x && p.y === this.hoveredPoint.y;
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
        if (this.dragging && this.hoveredPoint) {
            const libPoints = (this.props.item.data!.libraryItem as AutomationClip).points;
            const i = libPoints.indexOf(this.hoveredPoint.automationPoint);
            const { unit, value } = this.getUnitValue(mousePoint);
            libPoints.splice(i, 1, { type: this.hoveredPoint.automationPoint.type, unit, value });
            this.needsRender = true;
        } else {
            const oldHoveredPoint = this.hoveredPoint;
            this.hoveredPoint = this.points.find((p) => Math.pow(mousePoint.x - p.x, 2) + Math.pow(mousePoint.y - p.y, 2) < 25) || null;
            if (this.hoveredPoint !== oldHoveredPoint) { this.needsRender = true; }
        }
    }

    private onMouseDown(data: interaction.InteractionData) {
        if (this.hoveredPoint) {
            this.dragging = true;
            return false;
        }
    }

    private onMouseUp() {
        this.dragging = false;
    }

}
