import { IEvent } from "./event";

export type PreventableConsumerFunction<T = any> = (data: T) => boolean|void;

export class PreventableEvent<T> implements IEvent<T> {

    private subscribers = new Map<any, PreventableConsumerFunction<T>>();

    public subscribe(token: any, callback: PreventableConsumerFunction<T>): void {
        this.subscribers.set(token, callback);
    }

    public unsubscribe(token: any): void {
        this.subscribers.delete(token);
    }

    public emit(data: T): boolean {
        for (const [k, v] of this.subscribers.entries()) {
            if (v.call(k, data) === false) {
                return false;
            }
        }
        return true;
    }


}
