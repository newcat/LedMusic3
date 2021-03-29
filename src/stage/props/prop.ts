import { VueConstructor } from "vue";

export interface PropInfo {
    type: string;
    class: typeof Prop;
    component: VueConstructor;
    settingsComponent: VueConstructor;
}

export abstract class Prop {
    public abstract type: string;

    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
    public height: number = 0;
    public rotation: number = 0;
}
