import { IEvent, ConsumerFunction } from "./event";
import { Container } from "pixi.js";

export class GraphicsEvent<T> implements IEvent<T> {

    private subscribers = new Map<Container, ConsumerFunction<T>>();

    public subscribe(graphicsInstance: Container, callback: ConsumerFunction<T>) {
        this.subscribers.set(graphicsInstance, callback);
    }

    public unsubscribe(graphicsInstance: Container) {
        this.subscribers.delete(graphicsInstance);
    }

    public emit(graphicsInstance: Container, data: T) {
        let bubble = true;
        const subscriber = this.subscribers.get(graphicsInstance);
        if (subscriber && subscriber(data) === false) { bubble = false; }
        if (bubble && graphicsInstance && graphicsInstance.parent) { this.emit(graphicsInstance.parent, data); }
    }

}
