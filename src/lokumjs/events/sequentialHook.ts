// eslint-disable-next-line @typescript-eslint/ban-types
export type TokenType = object | symbol;
export type Listener<T> = (ev: T) => any;
export type HookTap<I, O> = (i: I) => O;

export class SequentialHook<I> {
    protected taps: Array<HookTap<I, I>> = [];
    private tapMap: Map<TokenType, HookTap<I, I>> = new Map();

    public tap(token: TokenType, tapFn: HookTap<I, I>) {
        if (this.tapMap.has(token)) {
            this.untap(token);
        }
        this.tapMap.set(token, tapFn);
        this.taps.push(tapFn);
    }

    public untap(token: TokenType) {
        if (this.tapMap.has(token)) {
            const tapFn = this.tapMap.get(token)!;
            this.tapMap.delete(token);
            const i = this.taps.indexOf(tapFn);
            if (i >= 0) {
                this.taps.splice(i, 1);
            }
        }
    }

    public execute(data: I): I {
        let currentValue = data;
        for (const tapFn of this.taps) {
            currentValue = tapFn(currentValue);
        }
        return currentValue;
    }
}
