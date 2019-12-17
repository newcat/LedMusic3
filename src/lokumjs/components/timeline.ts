import { Container, Point } from "pixi.js";
import { Editor } from "../model/editor";
import { Drawable, ArrayRenderer, IMouseEventData } from "../framework";

import { HeaderView } from "./header";
import { TrackView } from "./track";
import colors from "../colors";
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

        this.root.eventBus.events.pointerdown.subscribe(this.graphics, (data) => {
            this.onMousedown(data);
        }, true);
        this.root.eventBus.events.pointerup.subscribe(this.graphics, () => {
            this.onMouseup();
        }, true);
        this.root.eventBus.events.pointermove.subscribe(this.graphics, (data) => {
            this.onMousemove(data);
        }, true);
        this.root.eventBus.events.pointerout.subscribe(this.graphics, () => {
            this.isDragging = false;
        }, true);
        this.root.eventBus.events.keydown.subscribe(this, (ev) => {
            if (ev.key === "Control") { this.ctrlPressed = true; }
            if (ev.key === "Delete") { this.getSelectedItems().forEach((i) => this.props.editor.removeItem(i)); }
        });
        this.root.eventBus.events.keyup.subscribe(this, (ev) => {
            if (ev.key === "Control") { this.ctrlPressed = false; }
        });
        this.root.eventBus.events.resize.subscribe(this, () => { this.needsRender = true; });

        this.root.eventBus.events.itemClicked.subscribe(this, (data) => {
            this.onItemMousedown(data.item, data.area, data.event);
        });
        this.root.eventBus.events.removeTrack.subscribe(this, (track) => {
            this.props.editor.removeTrack(track);
        });

        this.graphics.addChild(this.trackContainer);
        this.addChild(this.header);
        this.addChild(this.tracks, false);
        this.trackContainer.addChild(this.tracks.graphics);

        this.tracks.onNewItem = (newTrack) => this.createView(TrackView, { track: newTrack, headerWidth: this.props.trackHeaderWidth });
        this.tracks.onRender = (trackView, t, i) => { trackView.graphics.y = this.trackOffsets[i]; };
        this.tracks.bind(this.props.editor.tracks, [
            this.props.editor.events.itemAdded,
            this.props.editor.events.itemRemoved
        ]);

        this.yScroll = this.header.props.headerHeight;

    }

    public render() {

        this.graphics
            .beginFill(colors.timeline)
                .drawRect(0, 0, this.root.app.screen.width, this.root.app.screen.height)
            .endFill();

        this.header.tick();

        this.trackContainer.y =  this.yScroll;
        this.trackOffsets = this.getTrackOffsets(this.props.editor.tracks);
        this.tracks.tick();

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

    private onMousedown(data: IMouseEventData) {
        this.dragStartPosition = data.data.global.clone();
        if (data.target && !data.target.ignoreClick && data.target !== this.graphics) { return; }
        if (!this.ctrlPressed) {
            this.props.editor.items.forEach((i) => { i.selected = false; });
        }
        this.isDragging = true;
    }

    private onMousemove(data: IMouseEventData) {
        const x = data.data.global.x;
        if (this.isDragging) {
            if (this.dragItem) {
                if (this.dragArea === "leftHandle" || this.dragArea === "rightHandle") {
                    const unit = this.root.positionCalculator.getUnit(x - this.props.trackHeaderWidth);
                    const newStart = this.dragArea === "leftHandle" ? unit : this.dragItem.start;
                    const newEnd = this.dragArea === "rightHandle" ? unit : this.dragItem.end;
                    if (this.props.editor.validateItem()) {
                        this.dragItem.move(newStart, newEnd);
                    }
                } else if (this.dragArea === "center") {
                    const diffUnits = Math.floor((x - this.dragStartPosition.x) / this.root.positionCalculator.unitWidth);
                    let diffTracks = 0;
                    const hoveredTrack = this.findTrackByPoint(data.data.global);
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

                this.root.positionCalculator.offset += data.data.global.x - this.dragStartPosition.x;
                this.yScroll += data.data.global.y - this.dragStartPosition.y;

                this.dragStartPosition = data.data.global.clone();

                if (this.root.positionCalculator.offset > 0) {
                    this.root.positionCalculator.offset = 0;
                }

                if (this.root.app.renderer.screen.height - (this.yScroll + this.trackContainer.height) > 0) {
                    this.yScroll = this.root.app.renderer.screen.height - this.trackContainer.height;
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

    private onItemMousedown(item: Item, area: ItemArea, data: IMouseEventData) {
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
    }

    private findTrackByPoint(p: Point): Track|undefined {
        const arr = Array.from(this.tracks.views.entries());
        for (const [k, v] of arr) {
            if (this.root.app.renderer.plugins.interaction.hitTest(p, v.graphics)) {
                return k;
            }
        }
        return undefined;
    }

}
