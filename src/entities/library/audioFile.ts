import { serialize, deserialize } from "bson";
import uuidv4 from "uuid/v4";
import { Texture } from "pixi.js";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
// import { AudioProcessor } from "../../processing/audioProcessor";
import WaveformWorker from "worker-loader!./waveformWorker";
import { StandardEvent } from "@/lokumjs";
import { readFile } from "fs";
import { promisify } from "util";

interface IWaveformPart {
    start: number;
    end: number;
    texture: Texture;
}

export class AudioFile implements ILibraryItem {

    public static deserialize(data: Buffer) {
        const { id, name, path } = deserialize(data);
        const af = new AudioFile(name, path);
        af.id = id;
        return af;
    }

    public id = uuidv4();
    public type = LibraryItemType.AUDIO_FILE;
    public name: string;
    public path: string;
    public loading = true;
    public error = false;
    public audioBuffer: AudioBuffer|null = null;
    public textures: IWaveformPart[] = [];

    public events = {
        loaded: new StandardEvent()
    };

    public constructor(name: string, path: string) {
        this.name = name;
        this.path = path;
    }

    public async load() {
        this.loading = true;
        this.error = false;

        if (!this.path) {
            this.loading = false;
            this.error = true;
            return;
        }
        const rawData = await (promisify(readFile)(this.path));

        // const sampleRate = AudioProcessor.sampleRate;
        const sampleRate = 192000;
        const offlineAudioContext = new OfflineAudioContext(1, 2, sampleRate);
        this.audioBuffer = await offlineAudioContext.decodeAudioData(rawData.buffer);

        const worker = new WaveformWorker();
        const samples = this.audioBuffer.getChannelData(0);
        worker.postMessage({ samples, sampleRate, resolution: 256 }, [samples.buffer]);

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
        }).catch((err) => {
            this.error = true;
        });

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

}
