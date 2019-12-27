<template>
    <div class="chart-container" style="position: relative; width: 100%; height: 100%;">
        <canvas
            ref="customCanvas"
            style="width: 100%;"
            @mousedown="mouseDownHandler"
            @mousemove="mouseMoveHandler"
            @mouseup="mouseUpHandler"
            @mouseleave="mouseUpHandler"
            @contextmenu.prevent=""
        ></canvas>
    </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Chart, { ChartData, ChartType, ChartConfiguration, ChartPoint, ChartElementsOptions, defaults } from "chart.js";

type Vector2D = [number, number];
interface IPoint2D { x: number; y: number; }

@Component
export default class CustomRandom extends Vue {

    @Prop()
    value!: number;

    @Prop()
    loadedPoints!: Vector2D[];

    @Prop({default: "monotone"})
    mode!: string;

    @Prop()
    min!: number;

    @Prop()
    max!: number;

    // Canvas
    canvas: HTMLCanvasElement|null = null;
    context: CanvasRenderingContext2D|null = null;
    chart!: Chart;

    // Data points
    points: IPoint2D[] = [];
    draggedPoint: IPoint2D |null = null;
    startPoint: IPoint2D |null = null;
    endPoint: IPoint2D |null = null;
    mousePosition: Vector2D = [0, 0];

    // Curve configuration
    textColor: string = "white";
    axisColor: string = "rgba(100,100,100,0.8)";
    gridColor: string = "rgba(100,100,100,0.3)";
    curveColor: string = "rgba(200,200,200,1)";
    digits: number = 1;
    pointRadius: number = 7;

    // Click state
    clicked: boolean = false;
    options: ChartConfiguration = {
        type: "scatter",
        data: {
            datasets: [{
                label: "Probability Distribution",
                data: this.chartData,
                borderColor: this.curveColor,
                backgroundColor: this.areaColor,
                fill: true,
                pointRadius: this.pointRadius,
                pointHitRadius: this.pointRadius,
                pointHoverRadius: this.pointRadius + 2,
                showLine: true,
                cubicInterpolationMode: "monotone"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                yAxes: [{
                    ticks: {
                        fontColor: this.textColor,
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        stepSize: 10,
                        callback: (label, index, labels) => ""
                    },
                    gridLines: {
                        color: this.gridColor,
                        zeroLineColor: this.axisColor
                    }
                }],
                xAxes: [{
                    ticks: {
                        fontColor: this.textColor,
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        stepSize: 10,
                        callback: (label, index, labels) =>
                            // Apply min max to ticks and limit digits
                            Math.round(
                                (label / 100 * (this.max - this.min) + this.min) * Math.pow(10, this.digits)
                            ) / Math.pow(10, this.digits)
                    },
                    gridLines: {
                        color: this.gridColor,
                        zeroLineColor: this.axisColor
                    }
                }],
            },
            legend: {
                labels: {
                    // This more specific font property overrides the global property
                    fontColor: this.textColor,
                }
            },
            elements: {
                point: {
                    borderColor: "white",
                    backgroundColor: "#C3C3C3"
                }
            },
            tooltips: {
                callbacks: {
                    label: (tooltipitem, data) => {
                        // Retrieve actual labels
                        const xLabel: string = tooltipitem.xLabel ? tooltipitem.xLabel as string : "0";
                        // Build custom label string
                        let label: string = "(";
                        // Map x: [0 - 100] to [min - max] and round to digits
                        label += Math.round((parseFloat(xLabel) / 100 * (this.max - this.min) + this.min) *
                            Math.pow(10, this.digits)) / Math.pow(10, this.digits);
                        label += ")";
                        return label;
                    }
                }
            },
            animation: {
                duration: 0, // general animation time
            },
            hover: {
                animationDuration: 0, // duration of animations when hovering an item
            },
            responsiveAnimationDuration: 0, // animation duration after a resize
        }
    };

    mounted() {
        // Get canvas element via reference
        this.canvas = this.$refs.customCanvas as HTMLCanvasElement;

        // Set canvas size
        this.canvas!.width = 1000;
        this.canvas!.height	= 1000;

        // Setup Chart
        this.context = this.canvas!.getContext("2d");
        this.chart = new Chart(this.context!, this.options);

        // Setup points, startPoint, endPoint from loadedPoints
        this.setupPoints();
    }

    @Watch("mode")
    onModeChanged() {
        switch (this.mode) {
            case "monotone":
                this.chart!.data.datasets![0].cubicInterpolationMode = "monotone";
                this.chart!.data.datasets![0].lineTension = 1;
                break;
            default:
                this.chart!.data.datasets![0].cubicInterpolationMode = "default";
                this.chart!.data.datasets![0].lineTension = 0;
                break;
        }
        this.update();
    }

    setupPoints() {
        // Copy loaded points that are within bounds
        this.points = [];
        const points: IPoint2D[] = this.points;
        this.loadedPoints.forEach((point) => {
            if (point[0] >= 0 &&
                point[0] <= 100 &&
                point[1] >= 0 &&
                point[1] <= 100) {
                points.push({x: point[0], y: point[1]});
            }
        });

        // Setup references to start and end point
        let foundStartPoint: IPoint2D |null = null;
        let foundEndPoint: IPoint2D |null = null;
        points.forEach((point) => {
            if (!foundStartPoint && point.x === 0) {
                foundStartPoint = point;
            }
            if (!foundEndPoint && point.x === 100) {
                foundEndPoint = point;
            }
        });

        // If there are no start and end points, add them
        if (!foundStartPoint) {
            foundStartPoint = {x: 0, y: 0};
            points.push(foundStartPoint);
        }
        if (!foundEndPoint) {
            foundEndPoint = {x: 100, y: 0};
            points.push(foundEndPoint);
        }
        this.startPoint = foundStartPoint;
        this.endPoint = foundEndPoint;

        this.setChartData(points);

        // Update editor
        this.update();
    }

    setChartData(data: IPoint2D[]) {
        const datasets = this.chart!.data!.datasets;
        if (datasets && datasets.length > 0) {
            datasets.forEach((dataset) => {
                dataset.data = data;
            });
        } else {
            throw new Error("Undefined dataset");
        }
    }

    @Watch("min")
    @Watch("max")
    update() {
        // Update chart
        this.chart!.update();
    }

    mouseDownHandler(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();

        // Get point at mouse cursor
        const firstPoint: any = this.chart.getElementAtEvent(e)[0];

        // On mouse left click
        if (e.button === 0) {
            // If a point has been selected
            if (firstPoint) {
                // Remember selected point
                this.draggedPoint = this.points[firstPoint._index];
            }
        }

        // On mouse right click
        if (e.button === 2) {
             // If a point has been selected
            if (firstPoint) {
                const selectedPoint = this.points[firstPoint._index];
                // Prevent deletion of start or end point
                if (selectedPoint !== this.startPoint && selectedPoint !== this.endPoint) {
                    // Remove selected point
                    this.points.splice(firstPoint._index, 1);
                }
            }
        }

         // On mouse double left click
        if (e.button === 0) {
            if (this.clicked) {
                this.clicked = false;
                const point = this.getPointFromChart(e);
                if (point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100) {
                    this.orderedInsert(this.points, point);
                }
            } else {
                this.clicked = true;
                setTimeout(() => { this.clicked = false; }, 500);
            }
        }

        this.update();
    }

    orderedInsert(data: IPoint2D[], point: IPoint2D) {
        // insert target into arr such that arr[first..last] is sorted,
        // given that arr[first..last-1] is already sorted.
        // Return the position where inserted.
        const first = 0;
        const last = data.length;
        let i = last;
        while ((i > first) && (point.x < data[i - 1].x)) {
            data[i] = data[i - 1];
            i = i - 1;
        }
        data[i] = point;
        return i;
    }

    mouseMoveHandler(e: MouseEvent) {
        // Move dragged point
        if (this.draggedPoint) {
            const pos = this.getPointFromChart(e);
            // Tolerance to remain order of start and end point
            const tol = 0.001;
            // Set limitation of chart
            pos.y = pos.y < 0 ? 0 : pos.y;
            pos.y = pos.y > 100 ? 100 : pos.y;
            pos.x = pos.x < 0 ? 0 + tol : pos.x;
            pos.x = pos.x > 100 ? 100 - tol : pos.x;

            // Lock start and end point on y-axis
            if (this.draggedPoint === this.startPoint || this.draggedPoint === this.endPoint) {
                this.draggedPoint.y = pos.y;
            } else {
                // Manage order even when points are passing each other while moving
                const index = this.points.indexOf(this.draggedPoint) as number;
                if (index > 0 && index < this.points.length - 1) {
                    if (this.points[index - 1].x > pos.x) {
                        // Swap with previous point
                        const temp = this.points[index];
                        this.points[index] = this.points[index - 1];
                        this.points[index - 1] = temp;
                    } else if (this.points[index + 1].x < pos.x) {
                        // Swap with next point
                        const temp = this.points[index];
                        this.points[index] = this.points[index + 1];
                        this.points[index + 1] = temp;
                    } else {
                        // Prevent user from creating two points at same x-coordinate
                        this.points[index].x += tol;
                    }
                }
                this.draggedPoint.x = pos.x;
                this.draggedPoint.y = pos.y;
            }
            this.update();
        }
    }

    mouseUpHandler(e: MouseEvent) {
        // Release point by resetting draggedPoint
        this.draggedPoint = null;

        // Emit update event whenever the points have been changed by either adding, removing or moving, update
        this.$emit("pointsUpdated", this.points.map((point) => [point.x, point.y]));
    }

    getPointFromChart(e: MouseEvent) {
        const scales: any = (this.chart as Chart.ChartOptions).scales;
        const scaleX = scales["x-axis-1"];
        const valueX = scaleX.getValueForPixel(e.offsetX);
        const scaleY = scales["y-axis-1"];
        const valueY = scaleY.getValueForPixel(e.offsetY);
        return {x: valueX, y: valueY};
    }

    get chartData() {
        const points = this.loadedPoints;
        const hash: any = {};
        const data: IPoint2D[] = [];
        for (let i = 0, l = points.length; i < l; i++) {
            const pointKey = points[i].join("|");
            if (!hash[pointKey]) {
                const point = { x: points[i][0], y: points[i][1] };
                data.push(point);
                hash[pointKey] = true;
            }
        }
        return data;
    }

    // Calculate a brighter color from curveColor
    get areaColor() {
        const rgba = new RegExp(/rgba\((\d*),(\d*),(\d*),(\d*)\)/, "gi").exec(this.curveColor);
        if (rgba) {
            return "rgba(" + rgba[1] + "," + rgba[2] + "," + rgba[3] + "," + 0.1 + ")";
        } else {
            return "rgba(255,255,255,255)";
        }
    }
}
</script>
