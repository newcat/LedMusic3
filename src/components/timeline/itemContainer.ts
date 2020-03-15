import { Drawable, IItemDrawableProps, ViewConstructor } from "@/lokumjs";
import { ILibraryItem, LibraryItemType } from "@/entities/library";
import { Text, TextStyle, Graphics } from "pixi.js";
import { observable, observe, unobserve } from "@nx-js/observer-util";

import { AutomationClipDrawable } from "./automationClipDrawable";
import { WaveformDrawable } from "./waveformDrawable";

const HEADER_HEIGHT = 15;

export class ItemContainer extends Drawable<IItemDrawableProps> {

    private libraryItem!: ILibraryItem;
    private observeFunction!: () => void;

    private textStyle = new TextStyle({ fill: this.viewInstance.colors.text, fontSize: 10 });
    private text?: Text;
    private itemDrawable?: Drawable<IItemDrawableProps>;
    private clipGraphics = new Graphics();

    public setup() {

        this.graphics.addChild(this.clipGraphics);
        this.graphics.mask = this.clipGraphics;

        this.libraryItem = observable(this.props.item.data!.libraryItem as ILibraryItem);

        this.observeFunction = () => {
            this.updateText();
        };
        observe(this.observeFunction);

        const itemDrawableType = this.getItemDrawable(this.libraryItem.type);
        if (itemDrawableType) {
            this.itemDrawable = this.createView(itemDrawableType, {
                height: this.props.height - HEADER_HEIGHT,
                width: this.props.width,
                item: this.props.item
            });
            this.addChild(this.itemDrawable);
        }

        this.needsRender = true;

    }

    public render() {

        this.clipGraphics.clear().beginFill(0xffffff).drawRect(0, 0, this.props.width, this.props.height).endFill();

        this.graphics.clear();
        this.graphics
            .beginFill(this.viewInstance.colors.itemHeader)
                .drawRoundedRect(1, 1, this.props.width - 2, HEADER_HEIGHT, 3)
            .endFill();

        if (this.text) {
            this.text.x = 10;
        }

        if (this.itemDrawable) {
            this.itemDrawable.graphics.y = HEADER_HEIGHT;
            this.itemDrawable.props.height = this.props.height - HEADER_HEIGHT;
            this.itemDrawable.props.width = this.props.width;
            this.itemDrawable.tick();
        }

    }

    public destroy() {
        unobserve(this.observeFunction);
    }

    private updateText() {
        if (this.text) {
            this.graphics.removeChildAt(this.graphics.children.indexOf(this.text));
        }
        this.text = new Text(this.libraryItem.name, this.textStyle);
        this.text.y = (HEADER_HEIGHT - this.text.getBounds().height) / 2;
        this.graphics.addChild(this.text);
    }

    private getItemDrawable(type: LibraryItemType): ViewConstructor<IItemDrawableProps, Drawable<IItemDrawableProps>>|null {
        switch (type) {
            case LibraryItemType.AUDIO_FILE:
                return WaveformDrawable;
            case LibraryItemType.AUTOMATION_CLIP:
                return AutomationClipDrawable;
            default:
                return null;
        }
    }

}
