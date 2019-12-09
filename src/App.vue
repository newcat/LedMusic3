<template>
<div style="display: flex; flex-direction: column; height: 100vh; width: 100vw;">
    <baklava-editor :plugin="editor.viewPlugin"></baklava-editor>
    <div>
        <input type="file" @change="loadAudio" />
        <button @click="playPause">Play/Pause</button>
    </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

import { BaklavaEditor } from "./editors/graph";
import GlobalProperties from "@/GlobalProperties";

import { createTimeline, Editor as LokumEditor, Track, Item } from "lokumjs";
import { Text, TextStyle, Texture, Sprite, Graphics } from "pixi.js";
import { AudioFile } from "./entities/library/audioFile";

interface IWaveformPart {
    start: number;
    end: number;
    sprite: Sprite;
}

@Component
export default class App extends Vue {

    public editor = new BaklavaEditor();

    public async loadAudio(ev: any) {
        const f = ev.target.files[0] as File;
        if (!f) { return; }
        const reader = new FileReader();
        const buff = await new Promise<ArrayBuffer>((res) => {
            reader.onload = (e) => res(e.target!.result as ArrayBuffer);
            reader.readAsArrayBuffer(f);
        });
        const item = new AudioFile("MyAudioFile", buff);
        await item.load();
    }

}
</script>
