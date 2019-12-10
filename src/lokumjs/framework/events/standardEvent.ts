import { IEvent, ConsumerFunction } from "./event";

export class StandardEvent<T> implements IEvent<T> {

    private subscribers = new Map<any, ConsumerFunction<T>>();

    public subscribe(token: any, callback: ConsumerFunction<T>): void {
        this.subscribers.set(token, callback);
    }

    public unsubscribe(token: any): void {
        this.subscribers.delete(token);
    }

    public emit(data: T): void {
        Array.from(this.subscribers.entries()).forEach(([k, v]) => v.call(k, data));
    }


}
