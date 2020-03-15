import { Container, Point, interaction } from "pixi.js";
import { Editor } from "../model/editor";
import { Drawable, ArrayRenderer } from "../framework";

import { HeaderView } from "./header";
import { TrackView } from "./track";
import { Track, Item } from "../model";
import { ItemArea } from "../types";

interface ITimelineViewProps {
    editor: Editor;
    trackHeaderWidth: number;
}

interface IItemState {
    id: string;
    start: number;
    end: number;
}

export class TimelineView extends Drawable<ITimelineViewProps> {

    public header!: HeaderView;
    public tracks!: ArrayRenderer<Track, TrackView>;
    private trackContainer = new Container();
    private trackOffsets: number[] = [];

    private isDragging = false;
    private dragArea: ItemArea|"" = "";
    private dragItem?: Item;
    private dragStartPosition = new Point(0, 0);
    private dragStartTrack?: Track;
    private dragStartStates: Array<{ item: IItemState, trackIndex: number }> = [];
    private ctrlPressed = false;
    private yScroll = 0;

    public setup() {

        this.setDefaultPropValues({ trackHeaderWidth: 200 });
        this.graphics.interactive = true;

        this.header = this.createView(HeaderView, { trackHeaderWidth: this.props.trackHeaderWidth });
        this.tracks = this.createView<ArrayRenderer<Track, TrackView>>(ArrayRenderer);

        this.viewInstance.eventBus.events.pointerdown.subscribe(this.graphics, (data) => { this.onMousedown(data); });
        this.viewInstance.eventBus.events.pointerup.subscribe(this.graphics, () => { this.onMouseup(); });
        this.viewInstance.eventBus.events.pointermove.subscribe(this.graphics, (data) => { this.onMousemove(data); });
        this.viewInstance.eventBus.events.pointerout.subscribe(this.graphics, () => { this.isDragging = false; });
        this.viewInstance.eventBus.events.keydown.subscribe(this, (ev) => {
            if (ev.key === "Control") { this.ctrlPressed = true; }
            if (ev.key === "Delete") { this.getSelectedItems().forEach((i) => this.props.editor.removeItem(i)); }
        });
        this.viewInstance.eventBus.events.keyup.subscribe(this, (ev) => {
            if (ev.key === "Control") { this.ctrlPressed = false; }
        });
        this.viewInstance.eventBus.events.zoom.subscribe(this, ({ positionX, amount }) => { this.zoom(positionX, amount); });
        this.viewInstance.eventBus.events.resize.subscribe(this, () => { this.needsRender = true; });

        this.viewInstance.eventBus.events.itemClicked.subscribe(this, (data) => { this.onItemMousedown(data.item, data.area, data.event); });
        this.viewInstance.eventBus.events.removeTrack.subscribe(this, (track) => {
            this.props.editor.items.filter((i) => i.trackId === track.id).forEach((i) => this.props.editor.removeItem(i));
            this.props.editor.removeTrack(track);
        });

        this.graphics.addChild(this.trackContainer);
        this.addChild(this.header);
        this.addChild(this.tracks, false);
        this.trackContainer.addChild(this.tracks.graphics);

        this.tracks.onNewItem = (newTrack) => this.createView(TrackView, { track: newTrack, headerWidth: this.props.trackHeaderWidth });
        this.tracks.onRender = (trackView, t, i) => { trackView.graphics.y = this.trackOffsets[i]; };
        this.tracks.bind(this.props.editor.tracks, [
            this.props.editor.events.trackAdded,
            this.props.editor.events.trackRemoved
        ]);

        this.yScroll = this.header.props.headerHeight;

    }

    public render() {

        this.graphics
            .beginFill(this.viewInstance.colors.timeline)
                .drawRect(0, 0, this.viewInstance.app.screen.width, this.viewInstance.app.screen.height)
            .endFill();

        this.header.tick();

        this.trackContainer.y =  this.yScroll;
        this.trackOffsets = this.getTrackOffsets(this.props.editor.tracks);
        this.tracks.tick();

    }

    public destroy() {
        super.destroy();
        this.viewInstance.eventBus.events.pointerdown.unsubscribe(this.graphics);
        this.viewInstance.eventBus.events.pointerup.unsubscribe(this.graphics);
        this.viewInstance.eventBus.events.pointermove.unsubscribe(this.graphics);
        this.viewInstance.eventBus.events.pointerout.unsubscribe(this.graphics);
        this.viewInstance.eventBus.events.keydown.unsubscribe(this);
        this.viewInstance.eventBus.events.keyup.unsubscribe(this);
        this.viewInstance.eventBus.events.zoom.unsubscribe(this);
        this.viewInstance.eventBus.events.resize.unsubscribe(this);
        this.viewInstance.eventBus.events.itemClicked.unsubscribe(this);
        this.viewInstance.eventBus.events.removeTrack.unsubscribe(this);
    }

    private getTrackOffsets(tracks: ReadonlyArray<Track>) {
        const offsets = [0];
        let prev = 0;
        tracks.forEach((t) => {
            offsets.push(prev += t.height);
        });
        return offsets;
    }

    private getSelectedItems() {
        return this.props.editor.items.filter((i) => i.selected);
    }

    private onMousedown(ev: interaction.InteractionEvent) {
        this.dragStartPosition = ev.data.global.clone();
        if (!this.ctrlPressed) {
            this.props.editor.items.forEach((i) => { i.selected = false; });
        }
        this.isDragging = true;
    }

    private onMousemove(ev: interaction.InteractionEvent) {
        const x = ev.data.global.x;
        if (this.isDragging) {
            if (this.dragItem) {
                if (this.dragArea === "leftHandle" || this.dragArea === "rightHandle") {
                    const unit = this.viewInstance.positionCalculator.getUnit(x - this.props.trackHeaderWidth);
                    const newStart = this.dragArea === "leftHandle" ? unit : this.dragItem.start;
                    const newEnd = this.dragArea === "rightHandle" ? unit : this.dragItem.end;
                    if (this.props.editor.validateItem()) {
                        this.dragItem.move(newStart, newEnd);
                    }
                } else if (this.dragArea === "center") {
                    const diffUnits = Math.floor((x - this.dragStartPosition.x) / this.viewInstance.positionCalculator.unitWidth);
                    let diffTracks = 0;
                    const hoveredTrack = this.findTrackByPoint(ev.data.global);
                    if (this.dragStartTrack && hoveredTrack) {
                        const startTrackIndex = this.props.editor.tracks.indexOf(this.dragStartTrack);
                        const endTrackIndex = this.props.editor.tracks.indexOf(hoveredTrack);
                        if (startTrackIndex >= 0 && endTrackIndex >= 0) {
                            diffTracks = endTrackIndex - startTrackIndex;
                        }
                    }

                    // check if some items would be dragged outside of the track bounds
                    this.dragStartStates.forEach((state) => {
                        const trackIndex = state.trackIndex;
                        const newTrackIndex = trackIndex + diffTracks;
                        if (newTrackIndex < 0) {
                            diffTracks = -trackIndex;
                        } else if (newTrackIndex >= this.props.editor.tracks.length) {
                            diffTracks = this.props.editor.tracks.length - trackIndex;
                        }
                    });

                    // validate all items
                    // TODO: Dont validate items one after another!
                    let valid = true;
                    this.dragStartStates.forEach((state) => {
                        const item = this.props.editor.items.find((j) => j.id === state.item.id)!;
                        const newTrackIndex = state.trackIndex + diffTracks;
                        const newTrack = this.props.editor.tracks[newTrackIndex];
                        if (!this.props.editor.validateItem()) {
                            valid = false;
                        }
                    });

                    if (valid) {
                        this.dragStartStates.forEach((state) => {
                            const item = this.props.editor.items.find((j) => j.id === state.item.id)!;
                            const newTrackIndex = state.trackIndex + diffTracks;
                            const newTrack = this.props.editor.tracks[newTrackIndex];
                            item.trackId = newTrack.id;
                            item.move(state.item.start + diffUnits, state.item.end + diffUnits);
                        });
                    }
                }
            } else {

                this.viewInstance.positionCalculator.offset += ev.data.global.x - this.dragStartPosition.x;
                this.yScroll += ev.data.global.y - this.dragStartPosition.y;

                this.dragStartPosition = ev.data.global.clone();

                if (this.viewInstance.positionCalculator.offset > 0) {
                    this.viewInstance.positionCalculator.offset = 0;
                }

                if (this.viewInstance.app.renderer.screen.height - (this.yScroll + this.trackContainer.height) > 0) {
                    this.yScroll = this.viewInstance.app.renderer.screen.height - this.trackContainer.height;
                }
                if (this.yScroll > this.header.props.headerHeight) {
                    this.yScroll = this.header.props.headerHeight;
                }

            }
        }
    }

    private onMouseup() {
        this.dragItem = undefined;
        this.isDragging = false;
        this.dragArea = "";
    }

    private onItemMousedown(item: Item, area: ItemArea, data: interaction.InteractionEvent) {
        if (area === "center") {
            if (this.ctrlPressed) {
                if (item.selected) {
                    item.selected = false;
                } else {
                    item.selected = true;
                }
            } else if (!item.selected) {
                this.props.editor.items.forEach((i) => { i.selected = false; });
                item.selected = true;
            }
        }
        this.dragArea = area;
        this.dragItem = item;
        this.dragStartTrack = this.findTrackByPoint(data.data.global);
        this.isDragging = true;
        this.dragStartStates = this.getSelectedItems()
            .map((i) => ({
                item: { id: i.id, start: i.start, end: i.end },
                trackIndex: this.props.editor.tracks.findIndex((t) => t.id === i.trackId)
            }));
        this.dragStartPosition = data.data.global.clone();
    }

    private zoom(positionX: number, amount: number) {
        const pc = this.viewInstance.positionCalculator;
        const newScale = pc.unitWidth * (1 - amount / 1500);
        const currentPoint = ((positionX - pc.offset) / pc.unitWidth);
        const newPoint = ((positionX - pc.offset) / newScale);
        pc.offset += (newPoint - currentPoint) * pc.unitWidth;
        if (pc.offset > 0) { pc.offset = 0; }
        pc.unitWidth = newScale;
    }

    private findTrackByPoint(p: Point): Track|undefined {
        const arr = Array.from(this.tracks.views.entries());
        for (const [k, v] of arr) {
            if (this.viewInstance.app.renderer.plugins.interaction.hitTest(p, v.graphics)) {
                return k;
            }
        }
        return undefined;
    }

}
