import { serialize, deserialize } from "bson";
import { LibraryItem, LibraryItemType } from "@/library";
import WaveformWorker from "worker-loader!./waveformWorker";
import { BaklavaEvent } from "@baklavajs/events";
import { readFile } from "fs";
import { promisify } from "util";

interface IWaveformPart {
    start: number;
    end: number;
    total: number;
    image: ImageBitmap;
}

export class AudioLibraryItem extends LibraryItem {
    public static sampleRate = 192000;

    public type = LibraryItemType.AUDIO;
    public name = "Empty";
    public path = "";
    public audioBuffer: AudioBuffer | null = null;
    public waveform: IWaveformPart[] = [];

    public events = {
        loaded: new BaklavaEvent<void>(),
    };

    public async load() {
        this.loading = true;
        this.error = false;

        if (!this.path) {
            this.loading = false;
            this.error = true;
            return;
        }

        try {
            console.log("Reading Data");
            const rawData = await promisify(readFile)(this.path);

            console.log("Creating Offline Context with sample rate", AudioLibraryItem.sampleRate);
            const offlineAudioContext = new OfflineAudioContext(1, 2, AudioLibraryItem.sampleRate);
            console.log("Decoding...");
            this.audioBuffer = await offlineAudioContext.decodeAudioData(rawData.buffer);

            console.log("Creating waveform");
            const worker = new WaveformWorker();
            const samples = this.audioBuffer.getChannelData(0);
            // Important! Using transferable here crashes Electron 8.4+
            worker.postMessage({ samples, sampleRate: AudioLibraryItem.sampleRate, resolution: 256 } /*, [samples.buffer]*/);

            await new Promise<void>((res, rej) => {
                worker.addEventListener("message", (ev) => {
                    const { type } = ev.data;
                    if (type === "progress") {
                        this.waveform.push(ev.data as IWaveformPart);
                    } else if (type === "finished") {
                        res();
                    } else if (type === "error") {
                        rej(ev.data.error);
                    } else {
                        rej(new Error("Invalid message type"));
                    }
                });
            });
        } catch (err) {
            console.warn(err);
            this.error = true;
        }

        this.loading = false;
        this.events.loaded.emit();
    }

    public serialize() {
        return serialize({
            id: this.id,
            name: this.name,
            path: this.path,
        });
    }

    public deserialize(buffer: Buffer): void {
        const { id, name, path } = deserialize(buffer);
        this.id = id;
        this.name = name;
        this.path = path;
    }
}
