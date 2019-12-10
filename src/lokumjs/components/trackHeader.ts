import { Track } from "../model";
import { Drawable } from "../framework";
import colors from "../colors";
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
        fill: colors.text,
        fontWeight: "bold"
    });

    private text = new Text("Test", this.style);
    private btnCloseSprite = new Sprite(this.root.textures.close);

    public setup() {

        this.graphics.addChild(this.text);
        this.graphics.addChild(this.btnCloseSprite);

        this.btnCloseSprite.anchor.set(1, 0);
        this.btnCloseSprite.tint = colors.secondary;
        this.btnCloseSprite.interactive = true;
        this.btnCloseSprite.buttonMode = true;

        this.root.eventManager.events.pointerdown.subscribe(this.btnCloseSprite, () => {
            this.root.eventManager.events.removeTrack.emit(this.props.track);
        });

    }

    render() {

        // fill background
        this.graphics
            .beginFill(colors.header)
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
