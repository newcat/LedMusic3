import colors from "@/colors";

const ctx: Worker = self as any;

function calculatePeaks(samples: Float32Array, sampleRate: number, resolution: number) {

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

function getWaveformSprites(peaks: Uint8Array) {
    try {
        for (let i = 0; i < peaks.length; i += 1024) {
            const end = Math.min(i + 1024, peaks.length);
            const image = createPartWaveformTexture(peaks, i, end);
            ctx.postMessage({ type: "progress", start: i, end, total: peaks.length, image }, [image]);
        }
        ctx.postMessage({ type: "finished" });
    } catch (err) {
        ctx.postMessage({ type: "error", error: err });
    }
}

function createPartWaveformTexture(peaks: Uint8Array, start: number, end: number) {
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

ctx.addEventListener("message", (ev) => {
    const { samples, sampleRate, resolution } = ev.data;
    const peaks = calculatePeaks(samples, sampleRate, resolution);
    getWaveformSprites(peaks);
});
