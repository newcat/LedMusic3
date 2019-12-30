import { GraphicsEvent, StandardEvent } from "../events";
import { interaction, Graphics } from "pixi.js";
import { Item, Track } from "../model";
import { ItemArea } from "../types";

export class EventBus {

    public events = {
        pointerdown: new GraphicsEvent<interaction.InteractionEvent>(),
        pointerup: new GraphicsEvent<interaction.InteractionEvent>(),
        pointermove: new GraphicsEvent<interaction.InteractionEvent>(),
        pointerover: new GraphicsEvent<interaction.InteractionEvent>(),
        pointerout: new GraphicsEvent<interaction.InteractionEvent>(),
        keydown: new StandardEvent<KeyboardEvent>(),
        keyup: new StandardEvent<KeyboardEvent>(),
        zoom: new StandardEvent<{ positionX: number, amount: number }>(),
        itemClicked: new StandardEvent<{ item: Item, area: ItemArea, event: interaction.InteractionEvent }>(),
        removeTrack: new StandardEvent<Track>(),
        renderItem: new StandardEvent<{ item: Item, graphics: Graphics, width: number, height: number }>(),
        resize: new StandardEvent<{ width: number, height: number }>()
    };

    public constructor(intMng: interaction.InteractionManager) {
        const that = this;
        intMng.addListener("pointerdown", (data: any) => { that.events.pointerdown.emit(data.target, data); });
        intMng.addListener("pointerup", (data: any) => { that.events.pointerup.emit(data.target, data); });
        intMng.addListener("pointermove", (data: any) => { that.events.pointermove.emit(data.target, data); });
        intMng.addListener("pointerover", (data: any) => { that.events.pointerover.emit(data.target, data); });
        intMng.addListener("pointerout", (data: any) => { that.events.pointerout.emit(data.target, data); });
    }

}
