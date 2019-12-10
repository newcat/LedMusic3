import { Graphics, Application } from "pixi.js";
import { Observer } from "./observer";
import { PositionCalculator } from "../positionCalculator";
import { EventManager } from "./eventManager";
import { ITextures } from "../textureManager";

export interface IRoot {
    app: Application;
    positionCalculator: PositionCalculator;
    eventManager: EventManager;
    textures: ITextures;
}

type PropsType = Record<string, any>;
type ViewConstructor<P, V extends Drawable<P>> = new (root: IRoot, propValues?: Partial<P>) => V;

export abstract class Drawable<Props extends PropsType> {

    public graphics: Graphics = new Graphics();
    public needsRender: boolean = true;

    public props: Props = {} as any;

    protected root: IRoot;

    private children: Array<Drawable<any>> = [];
    private observers: Observer[] = [];

    public constructor(root: IRoot, props?: Partial<Props>) {
        this.root = root;
        this.addDependency(this, "props", undefined, true);
        if (props) {
            Object.keys(props).forEach((k) => {
                (this.props as any)[k] = props[k];
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
        this.graphics.destroy();
        this.observers.forEach((o) => o.unregisterWatcher(this));
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

    protected addDependency(object: { [k: string]: any }, key: string, path?: string, deep = false) {
        const proxy = Observer.observe(object[key], deep);
        (proxy._observer as Observer).registerWatcher(this, (changedPath) => {
            if (!path || (path && path === changedPath)) {
                this.needsRender = true;
            }
        });
        this.observers.push(proxy._observer);
        object[key] = proxy;
    }

    protected createView<V extends Drawable<P>, P = any>(type: ViewConstructor<P, V>, propValues?: Partial<P>): V {
        const view = new type(this.root, propValues);
        view.setup();
        return view;
    }

    protected setDefaultPropValues(values: Partial<Props>) {
        Object.keys(values).forEach((k) => {
            if (this.props[k] === undefined) {
                (this.props as any)[k] = values[k];
            }
        });
    }

    private doesNeedRender(): boolean {
        return this.needsRender || this.children.some((c) => c.doesNeedRender());
    }

}
