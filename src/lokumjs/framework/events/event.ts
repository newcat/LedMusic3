export type ConsumerFunction<T = any> = (data: T) => void;

export interface IEvent<T> {
    subscribe(token: any, callback: ConsumerFunction<T>): void;
    unsubscribe(token: any): void;
    emit(token?: any, data?: any): void;
}
