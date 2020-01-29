import { serialize, deserialize, Binary } from "bson";
import uuidv4 from "uuid/v4";
import { Texture } from "pixi.js";
import { ILibraryItem, LibraryItemType } from "./libraryItem";
// import { AudioProcessor } from "../../processing/audioProcessor";
import WaveformWorker from "worker-loader!./waveformWorker";
import { StandardEvent } from "@/lokumjs";

interface IWaveformPart {
    start: number;
    end: number;
    texture: Texture;
}

export class AudioFile implements ILibraryItem {

    public static deserialize(data: Buffer) {
        const { id, name, rawData } = deserialize(data);
        const af = new AudioFile(name, (rawData as Binary).buffer.buffer);
        af.id = id;
        return af;
    }

    public id = uuidv4();
    public type = LibraryItemType.AUDIO_FILE;
    public name: string;
    public loading = true;
    public error = false;
    public audioBuffer: AudioBuffer|null = null;
    public textures: IWaveformPart[] = [];

    public events = {
        loaded: new StandardEvent()
    };

    private rawData: ArrayBuffer;

    public constructor(name: string, arrayBuffer: ArrayBuffer) {
        this.name = name;
        this.rawData = arrayBuffer;
    }

    public async load() {
        // const sampleRate = AudioProcessor.sampleRate;
        const sampleRate = 192000;
        const offlineAudioContext = new OfflineAudioContext(1, 2, sampleRate);

        // create a copy because the array buffer will be transferred when
        // calling decodeAudioData() and we need the original data when saving
        const copy = this.rawData.slice(0);
        this.audioBuffer = await offlineAudioContext.decodeAudioData(copy);

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
            rawData: new Binary(Buffer.from(this.rawData)),
        });
    }

}
