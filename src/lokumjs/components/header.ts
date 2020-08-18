import { Graphics, Text, TextStyle } from "pixi.js";
import { Drawable } from "../framework";

interface IHeaderViewProps {
    headerHeight: number;
    trackHeaderWidth: number;
}

export class HeaderView extends Drawable<IHeaderViewProps> {
    private markerContainer = new Graphics();
    private textStyle = new TextStyle({ fill: this.viewInstance.colors.labelsMajor, fontSize: 10 });
    private textPool: Array<{ used: boolean; text: Text }> = [];

    public setup() {
        this.setDefaultPropValues({ headerHeight: 30 });
        this.renderOnEvent(this.viewInstance.positionCalculator.events.moved);
        this.renderOnEvent(this.viewInstance.eventBus.events.resize);
        this.graphics.addChild(this.markerContainer);
    }

    public render() {
        this.graphics.clear();
        this.graphics
            .beginFill(this.viewInstance.colors.header)
            .drawRect(0, 0, this.viewInstance.app.screen.width, this.props.headerHeight)
            .endFill();

        const markers = this.viewInstance.positionCalculator.markers;
        this.markerContainer.clear();
        this.markerContainer.x = this.props.trackHeaderWidth;

        this.textPool.forEach((t) => {
            t.used = false;
        });

        markers.forEach((m) => {
            if (m.type === "major") {
                let text = this.getFirstUnusedText();
                if (!text) {
                    text = { used: true, text: new Text(m.unit.toString(), this.textStyle) };
                    text.text.anchor.set(0.5, 1);
                    this.textPool.push(text);
                    this.markerContainer.addChild(text.text);
                }

                text.used = true;
                text.text.text = this.viewInstance.editor.labelFunction(m.unit);
                text.text.position.set(m.position, this.props.headerHeight - 10);
                text.text.visible = true;
            }

            this.markerContainer
                .beginFill(
                    m.type === "major" ? this.viewInstance.colors.labelsMajor : this.viewInstance.colors.labelsMinor
                )
                .drawRect(m.position - 2, this.props.headerHeight - 6, 4, 6)
                .endFill();
        });

        this.textPool
            .filter((t) => !t.used)
            .forEach((t) => {
                t.text.visible = false;
            });
    }

    private getFirstUnusedText() {
        return this.textPool.find((t) => !t.used);
    }
}
