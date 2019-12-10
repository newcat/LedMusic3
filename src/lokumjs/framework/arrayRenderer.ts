import { Drawable } from "./drawable";

export class ArrayRenderer<T, V extends Drawable<any>, I = T> extends Drawable<{}> {

    public views = new Map<I, V>();

    private array!: ReadonlyArray<T>;
    private onNewItem!: (newItem: T, index: number, array: ReadonlyArray<T>) => V;
    private onRender?: (view: V, item: T, index: number, array: ReadonlyArray<T>) => void;
    private idFn?: (item: T) => I;

    public bind(
        array: ReadonlyArray<T>,
        onNewItem: (newItem: T, index: number, array: ReadonlyArray<T>) => V,
        onRender?: (view: V, item: T, index: number, array: ReadonlyArray<T>) => any,
        idFn?: (item: T) => I
    ) {
        this.array = array;
        this.onNewItem = onNewItem;
        this.onRender = onRender;
        this.idFn = idFn;
        this.addDependency(this, "array", undefined, true);
    }

    public render() {

        this.array.forEach((item, index, array) => {
            const id = this.getId(item);
            let view = this.views.get(id);
            if (!view) {
                view = this.onNewItem(item, index, array);
                this.views.set(id, view);
                this.addChild(view);
            }
            if (this.onRender) { this.onRender(view, item, index, array); }
            view.tick();
        });

        const removedEntries = Array.from(this.views.keys())
            .filter((id) => !this.array.find((x) => id === this.getId(x)));
        removedEntries.forEach((t) => {
            const view = this.views.get(t)!;
            this.removeChild(view);
            view.destroy();
            this.views.delete(t);
        });

    }

    private getId(item: T): I {
        return this.idFn ? this.idFn(item) : item as unknown as I;
    }

}
