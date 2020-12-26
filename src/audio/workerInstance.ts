import * as Comlink from "comlink";
import { WaveformWorker as WaveformWorkerType } from "./waveformWorker";
import WaveformWorker from "worker-loader!./waveformWorker";

const instance = Comlink.wrap<WaveformWorkerType>(new WaveformWorker());
export default instance;
