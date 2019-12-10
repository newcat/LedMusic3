import { TimelineView } from "./components/timeline";
import { Editor } from "./editor";
import { Application } from "pixi.js";
import { PositionCalculator } from "./positionCalculator";
import { EventManager, Observer } from "./framework";
import { loadTextures } from "./textureManager";

export * from "./editor";
export * from "./model";

export async function createTimeline(editor: Editor, wrapperEl: HTMLElement) {

    const canvasEl = wrapperEl.appendChild(document.createElement("canvas"));
    const app = new Application({
        view: canvasEl as HTMLCanvasElement,
        resizeTo: wrapperEl,
        antialias: true
    });

    const positionCalculator = new PositionCalculator(app);
    const eventManager = new EventManager(app.renderer.plugins.interaction);
    const textures = await loadTextures();
    const root = { app, positionCalculator, eventManager, textures };

    const timeline = new TimelineView(root, { editor });
    timeline.setup();
    app.stage.addChild(timeline.graphics);
    app.ticker.add(() => timeline.tick());

    // TODO: Only trigger when the current canvas is focused
    window.addEventListener("keydown", (ev) => eventManager.events.keydown.emit(ev));
    window.addEventListener("keyup", (ev) => eventManager.events.keyup.emit(ev));

    const proxy = Observer.observe(app.renderer.screen, true);
    app.renderer.screen = proxy;
    proxy._observer.registerWatcher(Symbol(), (changedPath) => {
        if (changedPath === "width" || changedPath === "height") {
            const { width, height } = app.renderer.screen;
            eventManager.events.resize.emit({ width, height });
        }
    });

    return { timeline, root };

}
