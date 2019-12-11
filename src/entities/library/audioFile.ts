import { serialize, deserialize, Binary,  } from "bson";
import uuidv4 from "uuid/v4";
import { Texture } from "pixi.js";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
import { AudioProcessor } from "../../processing/audioProcessor";
import WaveformWorker from "worker-loader!./waveformWorker";

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

    public id = uuidv4();
    public type: LibraryItemType = "audioFile";
    public name: string;
    public loading = true;
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
        worker.postMessage({ samples, sampleRate, resolution: 70 }, [samples.buffer]);

        await new Promise((res) => {
            worker.addEventListener("message", (ev) => {
                const { type } = ev.data;
                if (type === "progress") {
                    const { start, end, image } = ev.data;
                    const texture = Texture.from(image);
                    this.textures.push({ start, end, texture });
                } else if (type === "finished") {
                    res();
                } else {
                    throw new Error("Invalid message type");
                }
            });
        });

        this.loading = false;
    }

    public serialize() {
        return serialize({
            name: this.name,
            rawData: new Binary(Buffer.from(this.rawData)),
        });
    }

}
