import { Graphics } from "pixi.js";
import { Observer } from "./observer";
import { IEvent } from "../events";
import { View } from "../view";

export type PropsType = Record<string, any>;
export type ViewConstructor<P, V extends Drawable<P>> = new (viewInstance: View, propValues?: Partial<P>) => V;

export abstract class Drawable<Props extends PropsType> {
    public static createView<V extends Drawable<P>, P = any>(
        viewInstance: View,
        type: ViewConstructor<P, V>,
        propValues?: Partial<P>
    ): V {
        const view = new type(viewInstance, propValues);
        view.setup();
        return view;
    }

    public graphics: Graphics = new Graphics();
    public needsRender = true;

    public props: Props = {} as any;

    protected viewInstance: View;

    private children: Array<Drawable<any>> = [];
    private observers: Observer[] = [];
    private subscribedEvents: Array<IEvent<any>> = [];
    private propValues: Props = {} as any;

    public constructor(viewInstance: View, props?: Partial<Props>) {
        this.viewInstance = viewInstance;
        if (props) {
            Object.keys(props).forEach((k) => {
                this.setProp(k, props[k]);
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public setup() {}

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
        if (i >= 0) {
            this.children.splice(i, 1);
        }
        i = this.graphics.getChildIndex(child.graphics);
        this.graphics.removeChildAt(i);
    }

    protected abstract render(): void;

    protected renderOnEvent(ev: IEvent<any>) {
        ev.subscribe(this, () => {
            this.needsRender = true;
        });
    }

    protected createView<V extends Drawable<P>, P = any>(type: ViewConstructor<P, V>, propValues?: Partial<P>): V {
        return Drawable.createView(this.viewInstance, type, propValues);
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
                },
            });
        }
        (this.propValues as any)[key] = value;
    }
}
