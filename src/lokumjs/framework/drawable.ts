import { Graphics, Application } from "pixi.js";
import { Observer } from "./observer";
import { PositionCalculator } from "../positionCalculator";
import { EventBus } from "./eventBus";
import { ITextures } from "../textureManager";
import { Editor } from "../model/editor";
import { IEvent } from "../events";

export interface IRoot {
    app: Application;
    editor: Editor;
    positionCalculator: PositionCalculator;
    eventBus: EventBus;
    textures: ITextures;
}

type PropsType = Record<string, any>;
type ViewConstructor<P, V extends Drawable<P>> = new (root: IRoot, propValues?: Partial<P>) => V;

export abstract class Drawable<Props extends PropsType> {

    public static createView<V extends Drawable<P>, P = any>(root: IRoot, type: ViewConstructor<P, V>, propValues?: Partial<P>): V {
        const view = new type(root, propValues);
        view.setup();
        return view;
    }

    public graphics: Graphics = new Graphics();
    public needsRender: boolean = true;

    public props: Props = {} as any;

    protected root: IRoot;

    private children: Array<Drawable<any>> = [];
    private observers: Observer[] = [];
    private subscribedEvents: Array<IEvent<any>> = [];
    private propValues: Props = {} as any;

    public constructor(root: IRoot, props?: Partial<Props>) {
        this.root = root;
        if (props) {
            Object.keys(props).forEach((k) => {
                this.setProp(k, props[k]);
            });
        }
    }

    // tslint:disable-next-line: no-empty
    public setup() { }

    public tick() {
        if (this.doesNeedRender()) {
            this.graphics.clear();
            this.render();
            this.needsRender = false;
        }
    }

    public destroy() {
        this.observers.forEach((o) => o.unregisterWatcher(this));
        this.subscribedEvents.forEach((ev) => ev.unsubscribe(this));
        this.graphics.destroy();
    }

    public addChild(child: Drawable<any>, addToGraphics = true) {
        this.children.push(child);
        if (addToGraphics) {
            this.graphics.addChild(child.graphics);
        }
    }

    public removeChild(child: Drawable<any>) {
        let i = this.children.indexOf(child);
        if (i >= 0) { this.children.splice(i, 1); }
        i = this.graphics.getChildIndex(child.graphics);
        this.graphics.removeChildAt(i);
    }

    protected abstract render(): void;

    protected renderOnEvent(ev: IEvent<any>) {
        ev.subscribe(this, () => { this.needsRender = true; });
    }

    protected createView<V extends Drawable<P>, P = any>(type: ViewConstructor<P, V>, propValues?: Partial<P>): V {
        return Drawable.createView(this.root, type, propValues);
    }

    protected setDefaultPropValues(values: Partial<Props>) {
        Object.keys(values).forEach((k) => {
            this.setProp(k, values[k]);
        });
    }

    private doesNeedRender(): boolean {
        return this.needsRender || this.children.some((c) => c.doesNeedRender());
    }

    private setProp(key: string, value: any) {
        if (!Object.getOwnPropertyDescriptor(this.props, key)) {
            Object.defineProperty(this.props, key, {
                get: () => this.propValues[key],
                set: (v) => {
                    const oldValue = this.propValues[key];
                    if (oldValue !== v) {
                        (this.propValues as any)[key] = v;
                        this.needsRender = true;
                    }
                }
            });
        }
        (this.propValues as any)[key] = value;
    }

}
