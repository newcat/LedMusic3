// inspired by: https://github.com/katspaugh/wavesurfer.js/blob/master/src/webaudio.js

export class AudioProcessor {

    public static sampleRate = 44100;

    // WebAudio stuff
    private audioContext = new AudioContext();
    private gainNode = this.audioContext.createGain();
    private analyserNode = this.audioContext.createAnalyser();
    private source: AudioBufferSourceNode|null = null;

    // State
    private buffer: AudioBuffer|null = null;
    private startTime = 0;
    private startPosition = 0;

    private $position = 0;
    private $isPlaying = false;
    private $bpm = 130;

    public get volume() { return this.gainNode.gain.value; }
    public set volume(value: number) { this.gainNode.gain.setValueAtTime(value, this.audioContext.currentTime); }

    public get isPlaying() { return this.$isPlaying; }

    public get duration() {
        if (!this.buffer) {
            return 0;
        }
        return this.buffer.duration;
    }

    public get position() { return this.$position; }
    public set position(value: number) {
        let wasPlaying = false;
        if (this.isPlaying) {
            this.pause();
            wasPlaying = true;
        }
        this.$position = value;
        if (wasPlaying) {
            this.play();
        }
    }

    public constructor() {
        this.gainNode.connect(this.audioContext.destination);
        this.analyserNode.connect(this.gainNode);
    }

    public supportsWebAudio() {
        return !!(window.AudioContext || (window as any).webkitAudioContext);
    }

    public play() {

        if (!this.buffer) { return; }

        // need to re-create source on each playback
        this.source = this.audioContext.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.analyserNode);
        this.source.start(0, this.unitToSeconds(this.position));
        this.startTime = this.audioContext.currentTime;
        this.startPosition = this.position;

        if (this.audioContext.state === "suspended" && this.audioContext.resume) {
            this.audioContext.resume();
        }

        this.$isPlaying = true;

    }

    public pause() {
        if (this.source) {
            this.source.stop(0);
            this.source.disconnect();
            this.source = null;
        }
        this.updatePosition();
        this.$isPlaying = false;
    }

    public destroy() {
        if (!this.isPlaying) { this.pause(); }
        this.buffer = null;
        this.gainNode.disconnect();
        this.analyserNode.disconnect();
    }

    public updatePosition() {
        if (!this.isPlaying) { return; }
        this.$position = this.startPosition + this.secondsToUnits(this.audioContext.currentTime - this.startTime);
    }

    public unitToSeconds(units: number) {
        return (units / 24) * (60 / this.$bpm);
    }

    public secondsToUnits(seconds: number) {
        return (seconds / 60) * this.$bpm * 24;
    }

}
