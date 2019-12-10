import { Item } from "@/lokumjs";
import { Graphics, Sprite } from "pixi.js";
import { AudioFile } from "@/entities/library/audioFile";

interface ISpriteWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

export default function renderWaveformItem(item: Item, graphics: Graphics, width: number, height: number) {
    if (item.data && item.data.type === "music" && item.data.libraryItem.loaded) {
        const waveformParts = (item.data.libraryItem as AudioFile).textures;
        if (graphics.children.length === 0) {
            const sprites: ISpriteWaveformPart[] = [];
            waveformParts.forEach((p) => {
                const sprite = new Sprite(p.texture);
                graphics.addChild(sprite);
                sprites.push({ start: p.start, end: p.end, sprite });
            });
            item.data.sprites = sprites;
        }
        const totalLength = waveformParts[waveformParts.length - 1].end;
        const factor = width / totalLength;
        (item.data.sprites as ISpriteWaveformPart[]).forEach((p) => {
            p.sprite.x = p.start * factor;
            p.sprite.width = (p.end - p.start) * factor;
            p.sprite.height = height;
        });
    }
}
