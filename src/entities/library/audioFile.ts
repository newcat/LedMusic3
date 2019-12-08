import { serialize, deserialize, Binary,  } from "bson";
import { Texture } from "pixi.js";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
import { AudioProcessor } from "../../processing/audioProcessor";
import WaveformWorker from "worker-loader!../processing/waveformWorker";

interface IWaveformPart {
    start: number;
    end: number;
    texture: Texture;
}

export class AudioFile implements ILibraryItem {

    public static deserialize(data: Buffer) {
        const { name, rawData } = deserialize(data);
        return new AudioFile(name, rawData as Buffer);
    }

    public type: LibraryItemType = "audioFile";
    public name: string;
    public audioBuffer: AudioBuffer|null = null;
    public textures: IWaveformPart[] = [];

    private rawData: ArrayBuffer;

    public constructor(name: string, arrayBuffer: ArrayBuffer) {
        this.name = name;
        this.rawData = arrayBuffer;
    }

    public async load() {
        const sampleRate = AudioProcessor.sampleRate;
        const offlineAudioContext = new OfflineAudioContext(1, 2, sampleRate);
        this.audioBuffer = await offlineAudioContext.decodeAudioData(this.rawData);

        const worker = new WaveformWorker();
        const samples = this.audioBuffer.getChannelData(0);
        worker.postMessage({ samples: samples.buffer, sampleRate, resolution: 70 }, [samples.buffer]);

        await new Promise((res) => {
            worker.addEventListener("message", (ev) => {
                const { type } = ev.data;
                if (type === "progress") {
                    const { start, end, image } = ev.data;
                    this.textures.push({ start, end, texture: Texture.from(image) });
                } else if (type === "finished") {
                    res();
                } else {
                    throw new Error("Invalid message type");
                }
            }, { once: true });
        });
    }

    public serialize() {
        return serialize({
            name: this.name,
            rawData: new Binary(Buffer.from(this.rawData)),
        });
    }

}
