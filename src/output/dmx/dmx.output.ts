import { Buffer } from "buffer";
import { Color } from "@/graph/colors";
import { BaseOutput } from "../base.output";
import { OutputType } from "../outputTypes";
import { v4 as uuidv4 } from "uuid";
import { ipcRenderer } from "electron";

export interface IDmxOutputState {
    port: string;
    channels: string;
}

export interface IDmxOutputData {
    colors: Color[];
}

export class DmxOutput extends BaseOutput<IDmxOutputState, IDmxOutputData> {
    public type = OutputType.DMX;
    private id = uuidv4();

    protected _state: IDmxOutputState = {
        port: "",
        channels: "",
    };

    public constructor() {
        super();
        this.applyState(this._state);
    }

    public applyState(newState: IDmxOutputState) {
        this.warnings = [];
        super.applyState(newState);
        this.open();
    }

    public async send(data?: IDmxOutputData): Promise<void> {
        if (!this.state.channels) {
            return;
        }

        let colors: Color[] = [[0, 0, 0]];
        if (data && data.colors) {
            colors = data.colors;
        }

        let ri = 0;
        let gi = 0;
        let bi = 0;

        const buffer = Buffer.alloc(this.state.channels.length + 2);
        buffer[0] = Math.floor(this.state.channels.length / 256);
        buffer[1] = this.state.channels.length % 256;
        for (let i = 0; i < this.state.channels.length; i++) {
            const c = this.state.channels[i];
            if (c === "r" && ri < colors.length) {
                buffer[i + 2] = colors[ri][0];
                ri++;
            } else if (c === "g" && gi < colors.length) {
                buffer[i + 2] = colors[gi][1];
                gi++;
            } else if (c === "b" && bi < colors.length) {
                buffer[i + 2] = colors[bi][2];
                bi++;
            } else {
                buffer[i + 2] = 0;
            }
        }

        const result = await ipcRenderer.invoke("SERIALPORT_SEND", this.id, buffer);
        if (!result || !result.success) {
            this.warnings = ["Failed to send data"];
            console.warn(result);
        } else {
            this.warnings = [];
        }
    }

    public async destroy(): Promise<void> {
        const result = await ipcRenderer.invoke("SERIALPORT_CLOSE", this.id);
        if (!result || !result.success) {
            console.warn("Failed to close port", result);
        }
    }

    private async open() {
        if (!this.state.port) {
            return;
        }
        const result = await ipcRenderer.invoke("SERIALPORT_OPEN", this.id, this.state.port);
        if (!result || !result.success) {
            this.warnings = ["Failed to open port"];
            console.warn(result);
        }
    }
}
