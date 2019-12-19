import { Drawable } from "@/lokumjs/framework";

interface IPositionIndicatorProps {
    position: number;
    trackHeaderWidth: number;
}

export class PositionIndicator extends Drawable<IPositionIndicatorProps> {

    public setup() {
        this.renderOnEvent(this.root.positionCalculator.events.moved);
    }

    public render() {

        this.graphics
            .clear()
            .beginFill(0xFFFF00)
            .moveTo(-4, 0)
            .lineTo(0, 6)
            .lineTo(4, 0)
            .closePath()
            .endFill()
            .lineStyle(1, 0xFFFF00)
            .moveTo(0, 0)
            .lineTo(0, this.root.app.screen.height);

        const x = this.root.positionCalculator.getX(this.props.position) + this.props.trackHeaderWidth;
        if (x < this.props.trackHeaderWidth) {
            this.graphics.visible = false;
        } else {
            this.graphics.visible = true;
            this.graphics.x = x;
        }
    }

}
