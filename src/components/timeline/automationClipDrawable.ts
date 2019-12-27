import { Drawable, IItemDrawableProps } from "@/lokumjs";
import { Graphics, Point } from "pixi.js";
import { AutomationClip, IAutomationPoint } from "@/entities/library";

export class AutomationClipDrawable extends Drawable<IItemDrawableProps> {

    private clipGraphics = new Graphics();

    private points: Point[] = [];

    public setup() {
        this.graphics.addChild(this.clipGraphics);
        this.graphics.mask = this.clipGraphics;
    }

    public render() {

        this.clipGraphics.clear().beginFill(0xffffff).drawRect(0, 0, this.props.width, this.props.height).endFill();
        this.graphics.clear().lineStyle(1, 0xffffff);

        const points = (this.props.item.data!.libraryItem as AutomationClip).points;
        this.points = points.map((p) => this.getCoordinates(p));

        this.points.forEach((p, i) => {
            if (i === 0) {
                this.graphics.moveTo(p.x, p.y);
            } else {
                this.graphics.lineTo(p.x, p.y);
            }
        });

        this.graphics.lineStyle().beginFill(0xffffff);
        this.points.forEach((p) => {
            this.graphics.drawCircle(p.x, p.y, 3);
        });

    }

    private getCoordinates(p: IAutomationPoint): Point {
        const x = p.unit * this.viewInstance.positionCalculator.unitWidth;
        const y = this.props.height * (1 - p.value);
        return new Point(x, y);
    }

}
