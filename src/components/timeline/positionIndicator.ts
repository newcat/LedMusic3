import { Drawable } from "@/lokumjs/framework";

interface IPositionIndicatorProps {
    position: number;
    trackHeaderWidth: number;
}

export class PositionIndicator extends Drawable<IPositionIndicatorProps> {

    public setup() {
        this.renderOnEvent(this.viewInstance.positionCalculator.events.moved);
    }

    public render() {

        this.graphics
            .clear()
            .beginFill(this.viewInstance.colors.accent)
            .moveTo(-5, 0)
            .lineTo(0, 8)
            .lineTo(5, 0)
            .closePath()
            .endFill()
            .lineStyle(1, this.viewInstance.colors.accent)
            .moveTo(0, 0)
            .lineTo(0, this.viewInstance.app.screen.height);

        const x = this.viewInstance.positionCalculator.getX(this.props.position) + this.props.trackHeaderWidth;
        if (x < this.props.trackHeaderWidth) {
            this.graphics.visible = false;
        } else {
            this.graphics.visible = true;
            this.graphics.x = x;
        }
    }

}
