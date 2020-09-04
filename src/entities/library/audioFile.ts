import { serialize, deserialize } from "bson";
import { LibraryItem, LibraryItemType } from "./libraryItem";
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

export class AudioFile extends LibraryItem {
    public static sampleRate = 192000;

    public type = LibraryItemType.AUDIO_FILE;
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
        console.log("Reading Data");
        const rawData = await promisify(readFile)(this.path);

        console.log("Creating Offline Context with sample rate", AudioFile.sampleRate);
        const offlineAudioContext = new OfflineAudioContext(1, 2, AudioFile.sampleRate);
        console.log("Decoding...")
        this.audioBuffer = await offlineAudioContext.decodeAudioData(rawData.buffer);

        console.log("Creating waveform");
        const worker = new WaveformWorker();
        const samples = this.audioBuffer.getChannelData(0);
        worker.postMessage({ samples, sampleRate: AudioFile.sampleRate, resolution: 256 }, [samples.buffer]);

        try {
            await new Promise((res, rej) => {
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
