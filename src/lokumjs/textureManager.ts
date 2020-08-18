import { Texture } from "pixi.js";

export interface ITextures {
    close: Texture;
}

export async function loadTextures(): Promise<ITextures> {
    // Make sure to inline the icons with webpackMode = "eager"
    const data = await import(/* webpackMode: "eager" */ "./assets/close-24px.svg");
    const close = data.default;

    return {
        close: Texture.from(close),
    };
}
