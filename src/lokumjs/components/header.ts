import { Graphics, Text, TextStyle, BitmapText } from "pixi.js";
import { Drawable } from "../framework";
import colors from "../colors";

interface IHeaderViewProps {
    headerHeight: number;
    trackHeaderWidth: number;
}

export class HeaderView extends Drawable<IHeaderViewProps> {

    private markerContainer = new Graphics();
    private textStyle = new TextStyle({ fill: colors.labelsMajor, fontSize: 10 });
    private textPool: Array<{ used: boolean, text: Text }> = [];

    public setup() {
        this.setDefaultPropValues({ headerHeight: 30 });
        this.addDependency(this.root, "positionCalculator", undefined, true);
        this.root.eventManager.events.resize.subscribe(this, () => { this.needsRender = true; });
        this.graphics.addChild(this.markerContainer);
    }

    public render() {

        this.graphics.clear();
        this.graphics
            .beginFill(colors.header)
                .drawRect(0, 0, this.root.app.screen.width, this.props.headerHeight)
            .endFill();

        const markers = this.root.positionCalculator.markers;
        this.markerContainer.clear();
        this.markerContainer.x = this.props.trackHeaderWidth;

        this.textPool.forEach((t) => { t.used = false; });

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
                text.text.text = m.unit.toString();
                text.text.position.set(m.position, this.props.headerHeight - 10);

            }

            this.markerContainer
                .beginFill(m.type === "major" ? colors.labelsMajor : colors.labelsMinor)
                    .drawRect(m.position - 2, this.props.headerHeight - 6, 4, 6)
                .endFill();

        });

        this.textPool
            .filter((t) => !t.used)
            .forEach((t) => { t.text.visible = false; });

    }

    private getFirstUnusedText() {
        return this.textPool.find((t) => !t.used);
    }

}
