import { StandardEvent } from "../events";

export interface IObservableCollection<T> extends Array<T> {
    changed: StandardEvent;
}

export function createObservableCollection<T>() {
    const arr: T[] = [];
    (arr as IObservableCollection<T>).changed = new StandardEvent();
    return new Proxy(arr, {
        set(obj, path, value) {
            const r = Reflect.set(obj, path, value);
            if (r) { (arr as IObservableCollection<T>).changed.emit(); }
            return r;
        }
    }) as IObservableCollection<T>;
}
