import { IEvent, ConsumerFunction } from "./event";

export class GraphicsEvent implements IEvent<any> {

    private subscribers = new Map<any, (data?: any) => void>();
    private alwaysTriggers = new Map<any, (data?: any) => void>();

    public subscribe(graphicsInstance: any, callback: ConsumerFunction, triggerAlways = false) {
        this.subscribers.set(graphicsInstance, callback);
        if (triggerAlways) {
            this.alwaysTriggers.set(graphicsInstance, callback);
        }
    }

    public unsubscribe(graphicsInstance: any) {
        this.subscribers.delete(graphicsInstance);
        this.alwaysTriggers.delete(graphicsInstance);
    }

    public emit(graphicsInstance: any, data?: any) {
        const subscriber = this.subscribers.get(graphicsInstance);
        if (subscriber) { subscriber(data); }
        Array.from(this.alwaysTriggers.entries()).forEach(([k, v]) => {
            if (k !== graphicsInstance) {
                v(data);
            }
        });
    }

}
