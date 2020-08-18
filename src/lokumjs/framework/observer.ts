type OptionalObserver<T> = T & { _observer?: Observer };
type DefiniteObserver<T> = T & { _observer: Observer };
type PathType = string | number | symbol;
type WatcherCallback = (path: PathType) => void;

export class Observer {
    public static observe<T>(target: OptionalObserver<T>, deep: boolean): DefiniteObserver<T> {
        if (typeof target !== "object") {
            throw new Error("Can't create dependency on value");
        }

        if (!target._observer) {
            target._observer = new Observer();

            Object.keys(target)
                .filter((k) => k !== "_observer" && !k.startsWith("_$_"))
                .forEach((k) => {
                    const childValue = (target as any)[k];
                    if (typeof childValue === "object" && !!childValue) {
                        const proxy = Observer.observe(childValue, deep);
                        (target as any)[k] = proxy;
                    }
                });

            return new Proxy(target, {
                set(obj, path, value) {
                    const oldValue = (obj as any)[path];
                    if (deep && oldValue && oldValue._observer) {
                        (oldValue._observer as Observer).unregisterWatcher(this);
                    }

                    if (deep && typeof value === "object") {
                        value = Observer.observe(value, deep);
                        (value._observer as Observer).registerWatcher(this, (p) => {
                            target._observer!.invokeWatchers(path.toString() + "." + p.toString());
                        });
                    }

                    const r = Reflect.set(obj, path, value);
                    target._observer!.invokeWatchers(path);
                    return r;
                },
            }) as DefiniteObserver<T>;
        } else {
            return target as DefiniteObserver<T>;
        }
    }

    private watchers = new Map<any, WatcherCallback>();

    public registerWatcher(thisValue: any, callback: WatcherCallback) {
        this.watchers.set(thisValue, callback);
    }

    public unregisterWatcher(thisValue: any) {
        this.watchers.delete(thisValue);
    }

    public invokeWatchers(path: PathType) {
        this.watchers.forEach((w, t) => w.call(t, path));
    }
}
