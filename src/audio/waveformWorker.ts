import colors from "@/colors";
import * as Comlink from "comlink";

interface IWaveformPart {
    start: number;
    end: number;
    image: ImageBitmap;
}

interface IWaveform {
    sampleCount: number;
    parts: IWaveformPart[];
}

export class WaveformWorker {
    private waveforms = new Map<string, IWaveform>();

    public generateWaveform(id: string, samples: Float32Array, sampleRate: number, resolution: number) {
        const peaks = this.calculatePeaks(samples, sampleRate, resolution);
        const parts: IWaveformPart[] = [];
        for (let i = 0; i < peaks.length; i += 1024) {
            const end = Math.min(i + 1024, peaks.length);
            const image = this.createPartWaveformTexture(peaks, i, end);
            parts.push({ start: i, end, image });
        }
        this.waveforms.set(id, {
            sampleCount: peaks.length,
            parts,
        });
    }

    public drawWaveform(id: string, width: number, height: number, start: number, end: number, unitWidth: number): ImageBitmap {
        const waveform = this.waveforms.get(id);
        if (!waveform) {
            throw new Error(`Waveform ${id} not found`);
        }
        const canvas = new OffscreenCanvas(width, height);
        const renderingContext = canvas.getContext("2d")!;
        const totalSamples = waveform.sampleCount;
        const totalUnits = end - start;
        for (const part of waveform.parts) {
            const x = (part.start / totalSamples) * totalUnits * unitWidth;
            const partWidth = ((part.end - part.start) / totalSamples) * totalUnits * unitWidth;
            renderingContext.drawImage(part.image, x, 0, partWidth, height);
        }
        const imageBitmap = canvas.transferToImageBitmap();
        Comlink.transfer(imageBitmap, [imageBitmap]);
        return imageBitmap;
    }

    public deleteWaveform(id: string) {
        this.waveforms.delete(id);
    }

    private calculatePeaks(samples: Float32Array, sampleRate: number, resolution: number) {
        const peakSpan = Math.round(sampleRate / resolution);
        const peakCount = Math.ceil(samples.length / peakSpan);
        const peaks = new Uint8Array(peakCount);

        for (let i = 0; i < peakCount; i++) {
            let max = 0;
            for (let j = i * peakSpan; j < (i + 1) * peakSpan; j++) {
                if (Math.abs(samples[j]) > max) {
                    max = Math.abs(samples[j]);
                }
            }
            const peakValue = Math.round(255 * max);
            peaks[i] = peakValue;
        }

        return peaks;
    }

    private createPartWaveformTexture(peaks: Uint8Array, start: number, end: number) {
        const canvas = new OffscreenCanvas(end - start, 300);
        const cvCtx = canvas.getContext("2d")!;
        const center = 300 / 2;
        cvCtx.fillStyle = `#${colors.waveform.toString(16)}`;
        cvCtx.beginPath();
        cvCtx.moveTo(0, center);
        for (let i = start; i < end; i++) {
            const pxOffCenter = (300 / 2) * (peaks[i] / 255);
            cvCtx.lineTo(i - start, center - pxOffCenter);
        }
        for (let i = end - 1; i >= start; i--) {
            const pxOffCenter = (300 / 2) * (peaks[i] / 255);
            cvCtx.lineTo(i - start, center + pxOffCenter);
        }
        cvCtx.closePath();
        cvCtx.fill();

        return canvas.transferToImageBitmap();
    }
}

const waveformWorker = new WaveformWorker();
Comlink.expose(waveformWorker);
