import { Drawable, IItemDrawableProps } from "@/lokumjs";
import { Graphics } from "pixi.js";
import { AutomationClip, IAutomationPoint } from "@/entities/library";

export class AutomationClipDrawable extends Drawable<IItemDrawableProps> {

    private automationGraphics = new Graphics();
    private clipGraphics = new Graphics();

    public setup() {
        this.automationGraphics.addChild(this.clipGraphics);
        this.automationGraphics.mask = this.clipGraphics;
        this.graphics.addChild(this.automationGraphics);
        // todo subscribe events
    }

    public render() {

        this.clipGraphics.clear().beginFill(0xffffff).drawRect(0, 0, this.props.width, this.props.height).endFill();
        this.graphics.clear().lineStyle(1, 0xffffff);

        const points = (this.props.item.data!.libraryItem as AutomationClip).points;
        points.forEach((p, i) => {
            const { x, y } = this.getCoordinates(p);
            if (i === 0) {
                this.graphics.moveTo(x, y);
            } else {
                this.graphics.lineTo(x, y);
            }
        });

        this.graphics.lineStyle().beginFill(0xffffff);
        points.forEach((p) => {
            const { x, y } = this.getCoordinates(p);
            this.graphics.drawCircle(x, y, 3);
        });

    }

    private getCoordinates(p: IAutomationPoint) {
        const x = p.unit * this.viewInstance.positionCalculator.unitWidth;
        const y = this.props.height * (1 - p.value);
        return { x, y };
    }

}
