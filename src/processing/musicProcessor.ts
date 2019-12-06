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

    private mergedPeaks: number[] = [];
    private splitPeaks: number[][] = [];

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
        this.setLength(0);

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

    public getPeaks(length: number, first: number, last: number): number[] {
        if (!this.buffer) {
            return [];
        }

        first = first || 0;
        last = last || length - 1;

        this.setLength(length);

        if (!this.buffer) {
            return this.mergedPeaks;
        }

        /**
         * The following snippet fixes a buffering data issue on the Safari
         * browser which returned undefined It creates the missing buffer based
         * on 1 channel, 4096 samples and the sampleRate from the current
         * webaudio context 4096 samples seemed to be the best fit for rendering
         * will review this code once a stable version of Safari TP is out
         */
        if (!this.buffer.length) {
            const newBuffer = new AudioBuffer({
                numberOfChannels: 1,
                length: 4096,
                sampleRate: MusicProcessor.sampleRate
            });
            this.buffer = newBuffer;
        }

        const sampleSize = this.buffer.length / length;
        // tslint:disable-next-line: no-bitwise
        const sampleStep = ~~(sampleSize / 10) || 1;
        const channels = this.buffer.numberOfChannels;
        let c;

        for (c = 0; c < channels; c++) {
            const peaks = this.splitPeaks[c];
            const chan = this.buffer.getChannelData(c);
            let i;

            for (i = first; i <= last; i++) {
                // tslint:disable-next-line: no-bitwise
                const start = ~~(i * sampleSize);
                // tslint:disable-next-line: no-bitwise
                const end = ~~(start + sampleSize);
                let min = 0;
                let max = 0;
                let j;

                for (j = start; j < end; j += sampleStep) {
                    const value = chan[j];

                    if (value > max) {
                        max = value;
                    }

                    if (value < min) {
                        min = value;
                    }
                }

                peaks[2 * i] = max;
                peaks[2 * i + 1] = min;

                if (c === 0 || max > this.mergedPeaks[2 * i]) {
                    this.mergedPeaks[2 * i] = max;
                }

                if (c === 0 || min < this.mergedPeaks[2 * i + 1]) {
                    this.mergedPeaks[2 * i + 1] = min;
                }
            }
        }

        return this.mergedPeaks;
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

    private setLength(length: number) {
        // No resize, we can preserve the cached peaks.
        if (this.mergedPeaks && length === 2 * this.mergedPeaks.length - 1 + 2) {
            return;
        }

        this.splitPeaks = [];
        this.mergedPeaks = [];
        // Set the last element of the sparse array so the peak arrays are
        // appropriately sized for other calculations.
        const channels = this.buffer ? this.buffer.numberOfChannels : 1;
        let c;
        for (c = 0; c < channels; c++) {
            this.splitPeaks[c] = [];
            this.splitPeaks[c][2 * (length - 1)] = 0;
            this.splitPeaks[c][2 * (length - 1) + 1] = 0;
        }
        this.mergedPeaks[2 * (length - 1)] = 0;
        this.mergedPeaks[2 * (length - 1) + 1] = 0;
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
