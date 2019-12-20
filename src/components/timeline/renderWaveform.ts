import { Item } from "@/lokumjs";
import { Graphics, Sprite } from "pixi.js";
import { AudioFile, ILibraryItem, LibraryItemType } from "@/entities/library";

interface ISpriteWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

export default function renderWaveformItem(item: Item, graphics: Graphics, width: number, height: number) {
    if (item.data && item.data.libraryItem) {
        const libraryItem = item.data.libraryItem as ILibraryItem;
        if (libraryItem.type === LibraryItemType.AUDIO_FILE && !libraryItem.loading) {

            if (item.data.renderedWidth === width && item.data.renderedHeight === height) {
                return;
            }

            const waveformParts = (libraryItem as AudioFile).textures;
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
                p.sprite.width = (p.end + 1 - p.start) * factor;
                p.sprite.height = height;
            });

            item.data.renderedWidth = width;
            item.data.renderedHeight = height;

        }
    }
}
