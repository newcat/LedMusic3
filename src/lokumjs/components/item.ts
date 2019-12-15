import { Item, Track } from "../model";
import colors from "../colors";
import { Drawable, IMouseEventData } from "../framework";
import { Graphics } from "pixi.js";
import { ItemArea } from "../types";

interface IItemViewProps {
    item: Item;
    track: Track;
}

export class ItemView extends Drawable<IItemViewProps> {

    private leftHandle = new Graphics();
    private rightHandle = new Graphics();
    private contentGraphics = new Graphics();

    public setup() {
        this.graphics.interactive = true;
        this.graphics.buttonMode = true;

        this.leftHandle.interactive = true;
        this.leftHandle.cursor = "col-resize";
        this.graphics.addChild(this.leftHandle);

        this.rightHandle.interactive = true;
        this.rightHandle.cursor = "col-resize";
        this.graphics.addChild(this.rightHandle);

        this.graphics.addChild(this.contentGraphics);

        this.root.eventBus.events.pointerdown.subscribe(this.graphics, (data) => this.onClick(data, "center"));
        this.root.eventBus.events.pointerdown.subscribe(this.leftHandle, (data) => this.onClick(data, "leftHandle"));
        this.root.eventBus.events.pointerdown.subscribe(this.rightHandle, (data) => this.onClick(data, "rightHandle"));

        this.renderOnEvent(this.props.item.events.moved);
        this.renderOnEvent(this.props.item.events.resizableChanged);
        this.renderOnEvent(this.props.item.events.selectedChanged);
        this.renderOnEvent(this.props.item.events.temporaryChanged);
        this.renderOnEvent(this.props.)
        this.addDependency(this.root, "positionCalculator", undefined, true);
    }

    public render() {
        const x = this.root.positionCalculator.getX(this.props.item.start);
        const width = this.root.positionCalculator.getX(this.props.item.end) - x;
        if (this.props.item.selected) {
            if (this.props.item.resizable) {
                this.leftHandle.clear();
                this.rightHandle.clear();
                this.leftHandle
                    .lineStyle(2, colors.accent)
                    .beginFill(colors.accent)
                        .drawRoundedRect(x - 5, this.props.track.height / 2 - 20, 5, 40, 3)
                    .endFill();
                this.rightHandle
                    .lineStyle(2, colors.accent)
                    .beginFill(colors.accent)
                        .drawRoundedRect(x + width, this.props.track.height / 2 - 20, 5, 40, 3)
                    .endFill();
                this.leftHandle.visible = true;
                this.rightHandle.visible = true;
            } else {
                this.leftHandle.visible = false;
                this.rightHandle.visible = false;
            }
            this.graphics
                .lineStyle(2, colors.accent)
                .beginFill(colors.secondary)
                    .drawRoundedRect(x, 10, width, this.props.track.height - 20, 5)
                .endFill();
        } else {
            this.leftHandle.visible = false;
            this.rightHandle.visible = false;
            this.graphics
                .beginFill(colors.secondary)
                    .drawRoundedRect(x, 10, width, this.props.track.height - 20, 5)
                .endFill();
        }
        this.contentGraphics.x = x;
        this.contentGraphics.y = 10;
        this.contentGraphics.clear();
        this.root.eventBus.events.renderItem.emit({
            item: this.props.item,
            graphics: this.contentGraphics,
            width,
            height: this.props.track.height - 20
        });

        if (this.props.item.temporary) {
            this.graphics.alpha = 0.5;
        }
    }

    private onClick(data: IMouseEventData, area: ItemArea) {
        this.root.eventBus.events.itemClicked.emit({ item: this.props.item, area, event: data });
    }

}
