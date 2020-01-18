import { Track } from "../model";
import { Drawable } from "../framework";
import { Sprite, TextStyle, Text } from "pixi.js";

interface ITrackHeaderViewProps {
    track: Track;
    width: number;
}

export default class TrackHeaderView extends Drawable<ITrackHeaderViewProps> {

    protected defaultPropValues = {
        width: 200
    };

    private style = new TextStyle({
        fill: this.viewInstance.colors.text,
        fontWeight: "bold"
    });

    private text = new Text("Test", this.style);
    private btnCloseSprite = new Sprite(this.viewInstance.textures.close);

    public setup() {

        this.graphics.interactive = true; // To prevent items underneath being clicked

        this.graphics.addChild(this.text);
        this.graphics.addChild(this.btnCloseSprite);

        this.btnCloseSprite.anchor.set(1, 0);
        this.btnCloseSprite.tint = this.viewInstance.colors.secondary;
        this.btnCloseSprite.interactive = true;
        this.btnCloseSprite.buttonMode = true;

        this.viewInstance.eventBus.events.pointerdown.subscribe(this.btnCloseSprite, () => {
            this.viewInstance.eventBus.events.removeTrack.emit(this.props.track);
        });

    }

    render() {

        // fill background
        this.graphics
            .beginFill(this.viewInstance.colors.header)
                .drawRect(0, 0, this.props.width, this.props.track.height)
            .endFill();

        // draw track name
        this.text.text = this.props.track.name;
        const textBounds = this.text.getBounds();
        this.text.x = 30;
        this.text.y = (this.props.track.height - textBounds.height) / 2;

        // show delete icon if track can be removed
        if (this.props.track.removable) {
            this.btnCloseSprite.visible = true;
            this.btnCloseSprite.x = this.props.width;
            this.btnCloseSprite.y = 0;
        } else {
            this.btnCloseSprite.visible = false;
        }

    }

    public destroy() {
        this.text.destroy();
        super.destroy();
    }

}
