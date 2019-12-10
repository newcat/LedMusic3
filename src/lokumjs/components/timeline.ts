import { Container, Point } from "pixi.js";
import { Editor } from "../editor";
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
    private dragStartStates: Array<{ item: Item, trackIndex: number }> = [];
    private ctrlPressed = false;
    private yScroll = 0;

    public setup() {

        this.setDefaultPropValues({ trackHeaderWidth: 200 });
        this.graphics.interactive = true;

        this.header = this.createView(HeaderView, { trackHeaderWidth: this.props.trackHeaderWidth });
        this.tracks = this.createView<ArrayRenderer<Track, TrackView>>(ArrayRenderer);

        this.root.eventManager.events.pointerdown.subscribe(this.graphics, (data) => {
            this.onMousedown(data);
        }, true);
        this.root.eventManager.events.pointerup.subscribe(this.graphics, () => {
            this.onMouseup();
        }, true);
        this.root.eventManager.events.pointermove.subscribe(this.graphics, (data) => {
            this.onMousemove(data);
        }, true);
        this.root.eventManager.events.pointerout.subscribe(this.graphics, () => {
            this.isDragging = false;
        }, true);
        this.root.eventManager.events.keydown.subscribe(this, (ev) => {
            if (ev.key === "Control") { this.ctrlPressed = true; }
            if (ev.key === "Delete") { this.getSelectedItems().forEach((i) => this.props.editor.removeItem(i)); }
        });
        this.root.eventManager.events.keyup.subscribe(this, (ev) => {
            if (ev.key === "Control") { this.ctrlPressed = false; }
        });
        this.root.eventManager.events.resize.subscribe(this, () => { this.needsRender = true; });

        this.root.eventManager.events.itemClicked.subscribe(this, (data) => {
            this.onItemMousedown(data.item, data.area, data.event);
        });
        this.root.eventManager.events.removeTrack.subscribe(this, (track) => {
            this.props.editor.removeTrack(track);
        });

        this.graphics.addChild(this.trackContainer);
        this.addChild(this.header);
        this.addChild(this.tracks, false);
        this.trackContainer.addChild(this.tracks.graphics);

        this.tracks.bind(this.props.editor.tracks,
            (newTrack) => this.createView(TrackView, { track: newTrack, headerWidth: this.props.trackHeaderWidth }),
            (trackView, t, i) => { trackView.graphics.y = this.trackOffsets[i]; }
        );

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

    private getAllItems() {
        return this.props.editor.tracks.flatMap((t) => t.items);
    }

    private getSelectedItems() {
        return this.getAllItems().filter((i) => i.selected);
    }

    private onMousedown(data: IMouseEventData) {
        this.dragStartPosition = data.data.global.clone();
        if (data.target && !data.target.ignoreClick && data.target !== this.graphics) { return; }
        if (!this.ctrlPressed) {
            this.getAllItems().forEach((i) => { i.selected = false; });
        }
        this.isDragging = true;
    }

    private onMousemove(data: IMouseEventData) {
        const x = data.data.global.x;
        if (this.isDragging) {
            if (this.dragArea === "leftHandle") {
                const newStart = this.root.positionCalculator.getUnit(x - this.props.trackHeaderWidth);
                const track = this.props.editor.findTrackByItem(this.dragItem!)!;
                if (this.props.editor.validateItem(track, {...this.dragItem!, start: newStart})) {
                    this.dragItem!.start = newStart;
                }
            } else if (this.dragArea === "rightHandle") {
                const newEnd = this.root.positionCalculator.getUnit(x - this.props.trackHeaderWidth);
                const track = this.props.editor.findTrackByItem(this.dragItem!)!;
                if (this.props.editor.validateItem(track, {...this.dragItem!, end: newEnd})) {
                    this.dragItem!.end = newEnd;
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
                    const item = this.getAllItems().find((j) => j.id === state.item.id)!;
                    const newTrackIndex = state.trackIndex + diffTracks;
                    const newTrack = this.props.editor.tracks[newTrackIndex];
                    if (!this.props.editor.validateItem(newTrack, {
                        ...item,
                        start: state.item.start + diffUnits,
                        end: state.item.end + diffUnits
                    })) {
                        valid = false;
                    }
                });

                if (valid) {
                    this.dragStartStates.forEach((state) => {
                        const item = this.getAllItems().find((j) => j.id === state.item.id)!;
                        const newTrackIndex = state.trackIndex + diffTracks;
                        const newTrack = this.props.editor.tracks[newTrackIndex];
                        const currentTrack = this.props.editor.findTrackByItem(item)!;
                        if (currentTrack !== newTrack) {
                            currentTrack.items.splice(currentTrack.items.indexOf(item), 1);
                            newTrack.items.push(item);
                        }
                        item.start = state.item.start + diffUnits;
                        item.end = state.item.end + diffUnits;
                    });
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
                this.getAllItems().forEach((i) => { i.selected = false; });
                item.selected = true;
            }
        }
        this.dragArea = area;
        this.dragItem = item;
        this.dragStartTrack = this.findTrackByPoint(data.data.global);
        this.isDragging = true;
        this.dragStartStates = this.getSelectedItems()
            .map((i) => ({
                item: JSON.parse(JSON.stringify(i)),
                trackIndex: this.props.editor.tracks.indexOf(this.props.editor.findTrackByItem(i)!)
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
