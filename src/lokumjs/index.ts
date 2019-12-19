import { TimelineView } from "./components/timeline";
import { Editor } from "./model/editor";
import { Application } from "pixi.js";
import { PositionCalculator } from "./positionCalculator";
import { EventBus, Observer, IRoot } from "./framework";
import { loadTextures } from "./textureManager";

export * from "./model/editor";
export * from "./model";
export * from "./framework";


export async function createTimeline(editor: Editor, wrapperEl: HTMLElement) {

    const canvasEl = wrapperEl.appendChild(document.createElement("canvas"));
    const app = new Application({
        view: canvasEl as HTMLCanvasElement,
        resizeTo: wrapperEl,
        antialias: true
    });

    const positionCalculator = new PositionCalculator(app);
    const eventBus = new EventBus(app.renderer.plugins.interaction);
    const textures = await loadTextures();
    const root: IRoot = { app, editor, positionCalculator, eventBus, textures };

    const timeline = new TimelineView(root, { editor });
    timeline.setup();
    app.stage.addChild(timeline.graphics);
    app.ticker.add(() => timeline.tick());

    // TODO: Only trigger when the current canvas is focused
    document.addEventListener("keydown", (ev) => eventBus.events.keydown.emit(ev));
    document.addEventListener("keyup", (ev) => eventBus.events.keyup.emit(ev));
    canvasEl.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        let scrollAmount = ev.deltaY;
        if (ev.deltaMode === 1) {
            scrollAmount *= 32; // Firefox fix, multiplier is trial & error
        }
        eventBus.events.zoom.emit({ positionX: ev.offsetX, amount: scrollAmount });
    });

    const proxy = Observer.observe(app.renderer.screen, true);
    app.renderer.screen = proxy;
    proxy._observer.registerWatcher(Symbol(), (changedPath) => {
        if (changedPath === "width" || changedPath === "height") {
            const { width, height } = app.renderer.screen;
            eventBus.events.resize.emit({ width, height });
        }
    });

    return { timeline, root };

}
