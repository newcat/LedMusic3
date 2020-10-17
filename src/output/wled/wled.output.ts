import * as dgram from "dgram";
import { Buffer } from "buffer";
import { Color } from "@/graph/colors";
import { scaleColorArray } from "@/utils";
import { BaseOutput } from "../base.output";
import { OutputType } from "../outputTypes";

export interface IWledOutputState {
    host: string;
    port: number;
    timeout: number;
    numLeds: number;
}

export interface IWledOutputData {
    colors: Color[];
}

export class WledOutput extends BaseOutput<IWledOutputState, IWledOutputData> {
    public type = OutputType.WLED;

    protected _state: IWledOutputState = {
        host: "127.0.0.1",
        port: 21324,
        timeout: 255,
        numLeds: 60,
    };

    private socket?: dgram.Socket;

    public constructor() {
        super();
        this.applyState(this._state);
    }

    public applyState(newState: IWledOutputState) {
        this.warnings = [];
        super.applyState(newState);
        this.socket?.close();
        this.socket = dgram.createSocket("udp4");
    }

    public send(data?: IWledOutputData): void {
        if (!this.socket) {
            return;
        }

        let colors: Color[] = [[0, 0, 0]];
        if (data && data.colors) {
            colors = data.colors;
        }

        const buff = Buffer.allocUnsafe(3 * this.state.numLeds + 2);
        colors = scaleColorArray(colors, this.state.numLeds);

        buff[0] = 2; // Use DRGB protocol
        buff[1] = this.state.timeout;

        for (let i = 0; i < this.state.numLeds; i++) {
            buff[i * 3 + 2] = colors[i][0];
            buff[i * 3 + 3] = colors[i][1];
            buff[i * 3 + 4] = colors[i][2];
        }

        this.socket.send(buff, this.state.port, this.state.host, (err) => {
            if (err) {
                console.warn(`Failed to send WLED data to ${this.state.host}:${this.state.port}`, err);
            }
        });
    }
}
