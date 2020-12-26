import { serialize, deserialize } from "bson";
import { LibraryItem, LibraryItemType } from "@/library";
import WaveformWorker from "./workerInstance";
import { BaklavaEvent } from "@baklavajs/events";
import { readFile } from "fs";
import { promisify } from "util";

export class AudioLibraryItem extends LibraryItem {
    public static sampleRate = 192000;

    public type = LibraryItemType.AUDIO;
    public name = "Empty";
    public path = "";
    public audioBuffer: AudioBuffer | null = null;

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
            const samples = this.audioBuffer.getChannelData(0);
            // Important! Using transferable here crashes Electron 8.4+
            await WaveformWorker.generateWaveform(this.id, samples, AudioLibraryItem.sampleRate, 256);
        } catch (err) {
            console.warn(err);
            this.error = true;
        }

        this.loading = false;
        this.events.loaded.emit();
    }

    public async destroy() {
        await WaveformWorker.deleteWaveform(this.id);
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
