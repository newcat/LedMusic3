import { VueConstructor } from "vue";

export interface PropInfo {
    type: string;
    class: typeof Prop;
    component: VueConstructor;
    settingsComponent: VueConstructor;
}

export abstract class Prop {
    public abstract type: string;

    public x = 0;
    public y = 0;
    public width = 0;
    public height = 0;
    public rotation = 0;
}
