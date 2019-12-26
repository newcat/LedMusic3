import { Drawable, IItemDrawableProps } from "@/lokumjs";
import { Sprite } from "pixi.js";
import { AudioFile } from "@/entities/library";

interface ISpriteWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

export class WaveformDrawable extends Drawable<IItemDrawableProps> {

    private sprites: ISpriteWaveformPart[] = [];

    public setup() {

        const libraryItem = this.props.item.data!.libraryItem as AudioFile;
        if (libraryItem.loading) { return; }

        const waveformParts = (libraryItem as AudioFile).textures;
        if (this.sprites.length === 0) {
            waveformParts.forEach((p) => {
                const sprite = new Sprite(p.texture);
                this.graphics.addChild(sprite);
                this.sprites.push({ start: p.start, end: p.end, sprite });
            });
        }

    }

    public render() {
        const totalLength = this.sprites[this.sprites.length - 1].end;
        const factor = this.props.width / totalLength;
        this.sprites.forEach((p) => {
            p.sprite.x = p.start * factor;
            p.sprite.width = (p.end + 1 - p.start) * factor;
            p.sprite.height = this.props.height;
        });
    }

}
