import { Drawable, ArrayRenderer } from "../framework";
import TrackHeader from "./trackHeader";
import { Track, Item } from "../model";
import colors from "../colors";
import { ItemView } from "./item";
import { Rectangle } from "pixi.js";

export interface ITrackViewProps {
    headerWidth: number;
    track: Track;
}

export class TrackView extends Drawable<ITrackViewProps> {

    public header = this.createView(TrackHeader, { track: this.props.track });
    public items = this.createView<ArrayRenderer<Item, ItemView>>(ArrayRenderer);

    public setup() {

        this.addChild(this.items);
        this.addChild(this.header);

        this.addDependency(this.root, "positionCalculator", undefined, true);
        this.root.eventManager.events.resize.subscribe(this, () => { this.needsRender = true; });

        this.items.bind(this.props.track.items,
            (newItem) => this.createView(ItemView, { item: newItem, track: this.props.track }));

        this.graphics.interactive = true;
        (this.graphics as any).ignoreClick = true;

    }

    protected render(): void {

        // top and bottom borders
        this.drawLine(colors.markerLine, 0, 0, this.root.app.screen.width, 0);
        this.drawLine(colors.markerLine, 0, this.props.track.height, this.root.app.screen.width, this.props.track.height);
        this.graphics.hitArea = new Rectangle(0, 0, this.root.app.screen.width, this.props.track.height);

        // markers
        this.root.positionCalculator.markers
            .filter((m) => m.type === "major")
            .forEach((m) => {
                this.drawLine(colors.markerLine, m.position, 0, m.position, this.props.track.height);
            });

        this.items.graphics.x = this.props.headerWidth;
        this.items.tick();

        this.header.props.width = this.props.headerWidth;
        this.header.tick();

    }

    private drawLine(color: number, x1: number, y1: number, x2: number, y2: number) {
        this.graphics
            .lineStyle(1, color)
            .moveTo(x1, y1)
            .lineTo(x2, y2);
    }

}
