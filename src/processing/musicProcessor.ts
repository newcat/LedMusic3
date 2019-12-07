// source: https://github.com/katspaugh/wavesurfer.js/blob/master/src/webaudio.js

interface IState {
    init(): void;
    getPlayedPercents(): number;
    getCurrentTime(): number;
}
interface IStateDefinition {
    playing: IState;
    paused: IState;
    finished: IState;
}

export class MusicProcessor {

    static scriptBufferSize = 256;
    static sampleRate = 44100;

    private audioContext = new AudioContext();
    private offlineAudioContext = new OfflineAudioContext(1, 2, MusicProcessor.sampleRate);
    private gainNode = this.audioContext.createGain();
    private analyserNode = this.audioContext.createAnalyser();
    private scriptNode = this.createScriptNode();
    private source = this.createSource();

    private state: IState;
    private lastPlay = this.audioContext.currentTime;
    private startPosition = 0;
    private buffer: AudioBuffer|null = null;

    public get volume() {
        return this.gainNode.gain.value;
    }
    public set volume(value: number) {
        this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime);
    }

    public get positionPercentage() {
        return this.state.getPlayedPercents();
    }

    public get positionSeconds() {
        return this.audioContext.currentTime - this.lastPlay;
    }

    public get currentTime() {
        return this.state.getCurrentTime();
    }

    public get isPaused() {
        return this.state !== this.states.playing;
    }

    public get duration() {
        if (!this.buffer) {
            return 0;
        }
        return this.buffer.duration;
    }

    private states: IStateDefinition = {
        playing: {
            init: () => {
                this.addOnAudioProcess();
            },
            getPlayedPercents: () => {
                return this.currentTime / this.duration || 0;
            },
            getCurrentTime: () => {
                return this.startPosition + this.positionSeconds;
            }
        },
        paused: {
            init: () => {
                this.removeOnAudioProcess();
            },
            getPlayedPercents: () => {
                return this.currentTime / this.duration || 0;
            },
            getCurrentTime: () => {
                return this.startPosition;
            }
        },
        finished: {
            init: () => {
                this.removeOnAudioProcess();
            },
            getPlayedPercents: () => {
                return 1;
            },
            getCurrentTime: () => {
                return this.duration;
            }
        }
    };

    public constructor() {
        this.state = this.states.paused;
        this.state.init();
        this.gainNode.connect(this.audioContext.destination);
        this.analyserNode.connect(this.gainNode);
    }

    public supportsWebAudio() {
        return !!(window.AudioContext || (window as any).webkitAudioContext);
    }

    public decodeArrayBuffer(buffer: ArrayBuffer): Promise<AudioBuffer> {
        return this.offlineAudioContext.decodeAudioData(buffer);
    }

    public load(buffer: AudioBuffer) {
        this.startPosition = 0;
        this.lastPlay = this.audioContext.currentTime;
        this.buffer = buffer;
        this.source = this.createSource();
    }

    /**
     * Calculates the peaks for the loaded buffer
     * @param resolution Number of peaks to calculate per second of samples
     */
    public getPeaks(resolution: number): Uint8Array {
        if (!this.buffer) {
            return new Uint8Array(0);
        }

        // how many samples to analyze for a single peak
        const peakSpan = Math.round(MusicProcessor.sampleRate / resolution);
        const peakCount = Math.ceil(this.buffer.length / peakSpan);
        const peaks = new Uint8Array(peakCount);

        for (let c = 0; c < this.buffer.numberOfChannels; c++) {
            const samples = this.buffer.getChannelData(c);
            for (let i = 0; i < peakCount; i++) {
                let max = 0;
                for (let j = i * peakSpan; j < (i + 1) * peakSpan; j++) {
                    if (Math.abs(samples[j]) > max) {
                        max = Math.abs(samples[j]);
                    }
                }
                const peakValue = Math.round(255 * max);
                if (peakValue > peaks[i]) {
                    peaks[i] = peakValue;
                }
            }
        }

        return peaks;

    }

    public play() {
        if (!this.buffer) {
            return;
        }

        // need to re-create source on each playback
        this.source = this.createSource();
        this.source.start(0);

        if (this.audioContext.state === "suspended" && this.audioContext.resume) {
            this.audioContext.resume();
        }

        this.setState(this.states.playing);
    }

    public pause() {
        this.startPosition += this.positionSeconds;
        if (this.source) { this.source.stop(0); }
        this.setState(this.states.paused);
    }

    public seekTo(start: number, end: number) {
        if (!this.buffer) {
            return;
        }

        if (start === null) {
            start = this.currentTime;
            if (start >= this.duration) { start = 0; }
        }
        if (end === null) {
            end = this.duration;
        }

        this.startPosition = start;
        this.lastPlay = this.audioContext.currentTime;

        if (this.state === this.states.finished) {
            this.setState(this.states.paused);
        }

        return { start, end };
    }

    public destroy() {
        if (!this.isPaused) { this.pause(); }
        this.buffer = null;
        this.disconnectSource();
        this.gainNode.disconnect();
        this.scriptNode.disconnect();
        this.analyserNode.disconnect();
    }

    private setState(state: IState) {
        if (this.state !== state) {
            this.state = state;
            this.state.init();
        }
    }

    private createScriptNode() {
        const scriptNode = this.audioContext.createScriptProcessor();
        scriptNode.connect(this.audioContext.destination);
        return scriptNode;
    }

    private addOnAudioProcess() {
        this.scriptNode.onaudioprocess = () => {
            const time = this.currentTime;
            if (time >= this.duration) {
                this.setState(this.states.finished);
            }
        };
    }

    private removeOnAudioProcess() {
        this.scriptNode.onaudioprocess = null;
    }

    private disconnectSource() {
        if (this.source) {
            this.source.disconnect();
        }
    }

    private createSource() {
        this.disconnectSource();
        const source = this.audioContext.createBufferSource();
        source.buffer = this.buffer;
        source.connect(this.analyserNode);
        return source;
    }

}
