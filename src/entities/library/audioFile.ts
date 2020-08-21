import { serialize, deserialize } from "bson";
// import { Texture } from "pixi.js";
import { LibraryItem, LibraryItemType } from "./libraryItem";
// import { AudioProcessor } from "../../processing/audioProcessor";
// import WaveformWorker from "worker-loader!./waveformWorker";
import { BaklavaEvent } from "@baklavajs/events";
import { readFile } from "fs";
import { promisify } from "util";

/*interface IWaveformPart {
    start: number;
    end: number;
    texture: Texture;
}*/

export class AudioFile extends LibraryItem {
    public static sampleRate = 192000;

    public type = LibraryItemType.AUDIO_FILE;
    public name = "Empty";
    public path = "";
    public audioBuffer: AudioBuffer | null = null;
    // public textures: IWaveformPart[] = [];

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
        const rawData = await promisify(readFile)(this.path);

        // const sampleRate = AudioProcessor.sampleRate;
        // const sampleRate = 192000;
        const offlineAudioContext = new OfflineAudioContext(1, 2, AudioFile.sampleRate);
        this.audioBuffer = await offlineAudioContext.decodeAudioData(rawData.buffer);

        /*const worker = new WaveformWorker();
        const samples = this.audioBuffer.getChannelData(0);
        worker.postMessage({ samples, sampleRate: AudioFile.sampleRate, resolution: 256 }, [samples.buffer]);

        try {
            await new Promise((res, rej) => {
                worker.addEventListener("message", (ev) => {
                    const { type } = ev.data;
                    if (type === "progress") {
                        const { start, end, image } = ev.data;
                        const texture = Texture.from(image);
                        this.textures.push({ start, end, texture });
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
        }*/

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
