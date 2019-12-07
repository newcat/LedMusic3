<template>
<div style="display: flex; flex-direction: column; height: 100vh; width: 100vw;">
    <baklava-editor :plugin="viewPlugin"></baklava-editor>
    <div style="height: 50vh;" ref="wrapper"></div>
    <div>
        <button @click="loadAudio">Load Audio</button>
    </div>
</div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import chroma from "chroma-js";

import { Editor } from "@baklavajs/core";
import { ViewPlugin } from "@baklavajs/plugin-renderer-vue";
import { InterfaceTypePlugin } from "@baklavajs/plugin-interface-types";
import { OptionPlugin, NumberOption } from "@baklavajs/plugin-options-vue";
import { Engine } from "@baklavajs/plugin-engine";

import { registerNodes } from "@/nodes/registerNodes";
import { registerOptions } from "@/options/registerOptions";
import GlobalProperties from "@/GlobalProperties";

import { createTimeline, Editor as LokumEditor, Track, Item } from "lokumjs";
import { Text, TextStyle } from "pixi.js";
import { MusicProcessor } from "./processing/musicProcessor";

@Component
export default class App extends Vue {

    public editor = new Editor();
    public viewPlugin = new ViewPlugin();
    public intfTypePlugin = new InterfaceTypePlugin();
    public enginePlugin = new Engine(false);

    public lokumEditor = new LokumEditor();
    private peaks: Uint8Array|null = null;

    public created() {

        this.editor.use(this.enginePlugin);
        this.editor.use(this.viewPlugin);
        this.editor.use(this.intfTypePlugin);
        this.editor.use(new OptionPlugin());

        registerNodes(this.editor);
        registerOptions(this.viewPlugin);

        this.intfTypePlugin.addType("boolean", "darkcyan");
        this.intfTypePlugin.addType("color_single", "gold");
        this.intfTypePlugin.addType("color_array", "coral");
        this.intfTypePlugin.addType("number", "gray");
        this.intfTypePlugin.addType("positions", "lightblue");

        this.intfTypePlugin.addConversion("number", "boolean");
        this.intfTypePlugin.addConversion("number", "color_single", (v) => chroma(v, v, v));
        this.intfTypePlugin.addConversion("number", "color_array", (v) => [chroma(v, v, v)]);
        this.intfTypePlugin.addConversion("boolean", "number");

        setInterval(() => {
            this.enginePlugin.calculate();
        }, 1000 / GlobalProperties.fps);

    }

    public async mounted() {
        const { root } = await createTimeline(this.lokumEditor as any, this.$refs.wrapper as HTMLElement);
        const t = new Track("Music");
        t.items.push(new Item(1, 15));
        this.lokumEditor.addTrack(t);
        const style = new TextStyle({ fontSize: 10, fill: 0xffffff });
        const fpsText = new Text("FPS", style);
        fpsText.position.set(10, 10);
        root.app.stage.addChild(fpsText);
        root.app.ticker.add(() => {
            fpsText.text = root.app.ticker.elapsedMS.toFixed(2);
        });
        root.eventManager.events.renderItem.subscribe(this, (ev) => {
            if (this.peaks && ev.item.data && ev.item.data.type === "music") {
                ev.graphics.lineStyle(1, 0xffffff);
                this.peaks.forEach((p, i) => {
                    ev.graphics.moveTo(i, ev.height);
                    ev.graphics.lineTo(i, (p / 255) * ev.height);
                });
            }
        });
    }

    public async loadAudio() {
        const response = await fetch("beat.mp3");
        const buff = await response.arrayBuffer();
        const mp = new MusicProcessor();
        const auBuff = await mp.decodeArrayBuffer(buff);
        mp.load(auBuff);
        // mp.play();
        this.peaks = mp.getPeaks(30);
        this.lokumEditor.tracks[0].items.push(new Item(20, 100, { type: "music" }));
        console.log(JSON.parse(JSON.stringify(this.lokumEditor.tracks[0].items[0])));
    }

}
</script>
