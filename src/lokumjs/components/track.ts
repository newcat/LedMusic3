import { Drawable, ArrayRenderer } from "../framework";
import TrackHeader from "./trackHeader";
import { Track, Item } from "../model";
import { ItemView } from "./item";
import { Rectangle } from "pixi.js";

export interface ITrackViewProps {
    headerWidth: number;
    track: Track;
}

export class TrackView extends Drawable<ITrackViewProps> {

    public header = this.createView(TrackHeader, { track: this.props.track });
    public itemsView = this.createView<ArrayRenderer<Item, ItemView>>(ArrayRenderer);
    public items: Item[] = [];

    private subSymbol = Symbol("sub");

    public setup() {

        this.addChild(this.itemsView);
        this.addChild(this.header);

        this.renderOnEvent(this.viewInstance.positionCalculator.events.moved);
        this.renderOnEvent(this.viewInstance.eventBus.events.resize);

        this.viewInstance.editor.items.forEach((item) => item.events.trackChanged.subscribe(this.subSymbol, () => this.updateItems()));
        this.viewInstance.editor.events.itemAdded.subscribe(this.subSymbol, (item) => {
            item.events.trackChanged.subscribe(this.subSymbol, () => this.updateItems());
            this.updateItems();
        });
        this.viewInstance.editor.events.itemRemoved.subscribe(this.subSymbol, (item) => {
            item.events.trackChanged.unsubscribe(this.subSymbol);
            this.updateItems();
        });
        this.updateItems();

        this.itemsView.onNewItem = (newItem) => this.createView(ItemView, { item: newItem, track: this.props.track });

        this.graphics.interactive = true;
        (this.graphics as any).ignoreClick = true;

    }

    public destroy() {
        super.destroy();
        this.viewInstance.editor.events.itemAdded.unsubscribe(this.subSymbol);
        this.viewInstance.editor.events.itemRemoved.unsubscribe(this.subSymbol);
    }

    protected render(): void {

        // top and bottom borders
        this.drawLine(this.viewInstance.colors.markerLine, 0, 0, this.viewInstance.app.screen.width, 0);
        this.drawLine(this.viewInstance.colors.markerLine, 0, this.props.track.height, this.viewInstance.app.screen.width, this.props.track.height);
        this.graphics.hitArea = new Rectangle(0, 0, this.viewInstance.app.screen.width, this.props.track.height);

        // markers
        this.viewInstance.positionCalculator.markers
            .filter((m) => m.type === "major")
            .forEach((m) => {
                const position = m.position + this.props.headerWidth;
                this.drawLine(this.viewInstance.colors.markerLine, position, 0, position, this.props.track.height);
            });

        this.itemsView.graphics.x = this.props.headerWidth;
        this.itemsView.bind(this.items);
        this.itemsView.render();

        this.header.props.width = this.props.headerWidth;
        this.header.tick();

    }

    private drawLine(color: number, x1: number, y1: number, x2: number, y2: number) {
        this.graphics
            .lineStyle(1, color)
            .moveTo(x1, y1)
            .lineTo(x2, y2);
    }

    private updateItems() {
        this.items = this.viewInstance.editor.items.filter((i) => i.trackId === this.props.track.id);
        this.needsRender = true;
    }

}
