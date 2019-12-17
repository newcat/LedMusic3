import { Drawable } from "./drawable";
import { IObservableCollection } from "./observableCollection";
import { IEvent } from "../events";

export class ArrayRenderer<T, V extends Drawable<any>, I = T> extends Drawable<{}> {

    public views = new Map<I, V>();
    public onNewItem!: (newItem: T, index: number, array: ReadonlyArray<T>) => V;
    public onRender?: (view: V, item: T, index: number, array: ReadonlyArray<T>) => void;
    public idFn?: (item: T) => I;

    private array!: ReadonlyArray<T>;

    public bindObservable(array: IObservableCollection<T>) {
        this.bind(array, [array.changed]);
    }

    public bind(array: ReadonlyArray<T>, events?: Array<IEvent<any>>) {
        this.array = array;
        if (events) { events.forEach((ev) => this.renderOnEvent(ev)); }
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
