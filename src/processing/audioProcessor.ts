import { globalState } from "@/entities/globalState";
import { observe } from "@nx-js/observer-util";

// inspired by: https://github.com/katspaugh/wavesurfer.js/blob/master/src/webaudio.js

interface IAudioTrack {
    buffer: AudioBuffer;
    startUnit: number;
    source: AudioBufferSourceNode|null;
}

export class AudioProcessor {

    public static sampleRate = 44100;

    // WebAudio stuff
    public audioContext = new AudioContext();
    public analyserNode = this.audioContext.createAnalyser();
    private gainNode = this.audioContext.createGain();

    // State
    private tracks: IAudioTrack[] = [];
    private startTime = 0;
    private startPosition = 0;

    public constructor() {
        this.gainNode.connect(this.audioContext.destination);
        this.analyserNode.connect(this.gainNode);
        this.analyserNode.fftSize = 8192;
        AudioProcessor.sampleRate = this.audioContext.sampleRate;

        observe(() => this.gainNode.gain.setValueAtTime(globalState.volume, this.audioContext.currentTime));
        globalState.events.positionSetByUser.subscribe(this, () => {
            if (globalState.isPlaying) {
                this.pause(false);
                this.play();
            }
        });
    }

    public supportsWebAudio() {
        return !!(window.AudioContext || (window as any).webkitAudioContext);
    }

    public play() {

        // need to re-create sources on each playback
        for (const t of this.tracks) {
            this.destroySource(t.source);
            t.source = this.createSource(t.buffer, t.startUnit);
        }
        this.startTime = this.audioContext.currentTime;
        this.startPosition = globalState.position;

        if (this.audioContext.state === "suspended" && this.audioContext.resume) {
            this.audioContext.resume();
        }

    }

    public pause(updatePosition = true) {
        for (const t of this.tracks) {
            this.destroySource(t.source);
            t.source = null;
        }
        if (updatePosition) { this.updatePosition(); }
    }

    public destroy() {
        if (!globalState.isPlaying) { this.pause(); }
        this.tracks = [];
        this.gainNode.disconnect();
        this.analyserNode.disconnect();
    }

    public updatePosition() {
        if (!globalState.isPlaying) { return; }
        globalState.position = this.startPosition + this.secondsToUnits(this.audioContext.currentTime - this.startTime);
    }

    public unitToSeconds(units: number) {
        return (units / 24) * (60 / globalState.bpm);
    }

    public secondsToUnits(seconds: number) {
        return (seconds / 60) * globalState.bpm * 24;
    }

    public registerBuffer(buffer: AudioBuffer, startUnit: number) {
        const source = globalState.isPlaying ? this.createSource(buffer, startUnit) : null;
        this.tracks.push({ buffer, startUnit, source });
    }

    public unregisterBuffer(buffer: AudioBuffer) {
        const i = this.tracks.findIndex((t) => t.buffer === buffer);
        if (i >= 0) {
            this.destroySource(this.tracks[i].source);
            this.tracks.splice(i, 1);
        }
    }

    private createSource(buffer: AudioBuffer, startUnit: number) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.analyserNode);
        const offset = this.unitToSeconds(globalState.position - startUnit);
        if (offset < 0) {
            // tslint:disable-next-line:no-console
            console.warn("Source offset < 0");
        }
        source.start(0, Math.max(offset, 0));
        return source;
    }

    private destroySource(source: AudioBufferSourceNode|null) {
        if (source) {
            source.stop(0);
            source.disconnect();
        }
    }

}
