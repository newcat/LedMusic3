import { Item, Track } from "../model";
import { Drawable } from "../framework";
import { Graphics, interaction } from "pixi.js";
import { ItemArea } from "../types";
import { IItemDrawableProps } from "../view";

interface IItemViewProps {
    item: Item;
    track: Track;
}

export class ItemView extends Drawable<IItemViewProps> {

    private leftHandle = new Graphics();
    private rightHandle = new Graphics();
    private contentDrawable: Drawable<IItemDrawableProps>|null = null;

    public setup() {
        this.graphics.interactive = true;
        this.graphics.buttonMode = true;

        this.leftHandle.interactive = true;
        this.leftHandle.cursor = "col-resize";
        this.graphics.addChild(this.leftHandle);

        this.rightHandle.interactive = true;
        this.rightHandle.cursor = "col-resize";
        this.graphics.addChild(this.rightHandle);

        const contentDrawableType = this.viewInstance.itemDrawableFunction?.call(undefined, this.props.item);
        if (contentDrawableType) {
            this.contentDrawable = this.createView(contentDrawableType, { item: this.props.item, width: 0, height: 0 });
            this.addChild(this.contentDrawable);
        }

        this.viewInstance.eventBus.events.pointerdown.subscribe(this.graphics, (ev) => this.onClick(ev, "center"));
        this.viewInstance.eventBus.events.pointerdown.subscribe(this.leftHandle, (ev) => this.onClick(ev, "leftHandle"));
        this.viewInstance.eventBus.events.pointerdown.subscribe(this.rightHandle, (ev) => this.onClick(ev, "rightHandle"));

        this.renderOnEvent(this.props.item.events.moved);
        this.renderOnEvent(this.props.item.events.resizableChanged);
        this.renderOnEvent(this.props.item.events.selectedChanged);
        this.renderOnEvent(this.props.item.events.temporaryChanged);
        this.renderOnEvent(this.viewInstance.positionCalculator.events.moved);
    }

    public render() {
        const x = this.viewInstance.positionCalculator.getX(this.props.item.start);
        const width = this.viewInstance.positionCalculator.getX(this.props.item.end) - x;
        if (this.props.item.selected) {
            if (this.props.item.resizable) {
                this.leftHandle.clear();
                this.rightHandle.clear();
                this.leftHandle
                    .lineStyle(2, this.viewInstance.colors.accent)
                    .beginFill(this.viewInstance.colors.accent)
                        .drawRoundedRect(x - 5, this.props.track.height / 2 - 20, 5, 40, 3)
                    .endFill();
                this.rightHandle
                    .lineStyle(2, this.viewInstance.colors.accent)
                    .beginFill(this.viewInstance.colors.accent)
                        .drawRoundedRect(x + width, this.props.track.height / 2 - 20, 5, 40, 3)
                    .endFill();
                this.leftHandle.visible = true;
                this.rightHandle.visible = true;
            } else {
                this.leftHandle.visible = false;
                this.rightHandle.visible = false;
            }
            this.graphics
                .lineStyle(2, this.viewInstance.colors.accent)
                .beginFill(this.viewInstance.colors.secondary, 0.3)
                    .drawRoundedRect(x, 10, width, this.props.track.height - 20, 5)
                .endFill();
        } else {
            this.leftHandle.visible = false;
            this.rightHandle.visible = false;
            this.graphics
                .beginFill(this.viewInstance.colors.secondary, 0.3)
                    .drawRoundedRect(x, 10, width, this.props.track.height - 20, 5)
                .endFill();
        }

        if (this.contentDrawable) {
            this.contentDrawable.graphics.x = x;
            this.contentDrawable.graphics.y = 10;
            this.contentDrawable.props.width = width;
            this.contentDrawable.props.height = this.props.track.height - 20;
            this.contentDrawable.tick();
        }

        if (this.props.item.temporary) {
            this.graphics.alpha = 0.5;
        }
    }

    private onClick(event: interaction.InteractionEvent, area: ItemArea) {
        this.viewInstance.eventBus.events.itemClicked.emit({ item: this.props.item, area, event });
        return false;
    }

}
