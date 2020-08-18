import { Application } from "pixi.js";
import { PositionCalculator } from "./positionCalculator";
import { EventBus, ViewConstructor, Drawable, Observer } from "./framework";
import { ITextures } from "./textureManager";
import { Editor, Item } from "./model";
import { TimelineView } from "./components/timeline";
import { loadTextures } from "./textureManager";
import defaultColors, { IColorDefinitions } from "./colors";

export type ItemDrawableFunction = (
    item: Item
) => ViewConstructor<IItemDrawableProps, Drawable<IItemDrawableProps>> | null;
export interface IItemDrawableProps {
    item: Item;
    width: number;
    height: number;
}

export class View {
    public static async mount(editor: Editor, wrapperEl: HTMLElement) {
        const canvasEl = document.createElement("canvas");
        canvasEl.tabIndex = 1;
        wrapperEl.appendChild(canvasEl);
        const app = new Application({
            view: canvasEl as HTMLCanvasElement,
            resizeTo: wrapperEl,
            antialias: true,
        });

        const textures = await loadTextures();
        const view = new View(app, editor, textures, canvasEl);

        return view;
    }

    public readonly app: Application;
    public readonly editor: Editor;
    public readonly positionCalculator: PositionCalculator;
    public readonly eventBus: EventBus;
    public readonly textures!: ITextures;
    public timelineDrawable!: TimelineView;

    public colors: IColorDefinitions = defaultColors;
    public itemDrawableFunction: ItemDrawableFunction | null = null;

    private constructor(app: Application, editor: Editor, textures: ITextures, canvasEl: HTMLCanvasElement) {
        this.app = app;
        this.editor = editor;
        this.positionCalculator = new PositionCalculator(app);
        this.eventBus = new EventBus(app.renderer.plugins.interaction);
        this.textures = textures;

        const timeline = new TimelineView(this, { editor });
        this.timelineDrawable = timeline;

        timeline.setup();
        app.stage.addChild(timeline.graphics);
        app.ticker.add(() => timeline.tick());

        canvasEl.addEventListener("keydown", (ev) => this.eventBus.events.keydown.emit(ev));
        canvasEl.addEventListener("keyup", (ev) => this.eventBus.events.keyup.emit(ev));
        canvasEl.addEventListener("wheel", (ev) => {
            ev.preventDefault();
            let scrollAmount = ev.deltaY;
            if (ev.deltaMode === 1) {
                scrollAmount *= 32; // Firefox fix, multiplier is trial & error
            }
            this.eventBus.events.zoom.emit({ positionX: ev.offsetX, amount: scrollAmount });
        });

        const proxy = Observer.observe(app.renderer.screen, true);
        app.renderer.screen = proxy;
        proxy._observer.registerWatcher(Symbol(), (changedPath) => {
            if (changedPath === "width" || changedPath === "height") {
                const { width, height } = app.renderer.screen;
                this.eventBus.events.resize.emit({ width, height });
            }
        });
    }

    public unmount() {
        this.app.destroy(true);
        this.timelineDrawable.destroy();
        // TODO document.removeEventListener()
    }
}
