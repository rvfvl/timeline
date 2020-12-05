import { KonvaEventObject } from "konva/types/Node";
import { Vector2d } from "konva/types/types";
import React, { Component, Fragment, ReactNode, RefObject } from "react";
import { Stage, Layer, Line, Text, Rect } from "react-konva";
import _ from "lodash"

interface TimelineStateProps {
  width: number;
  height: number;
}

interface TimelineStageState {
  zoom: number;
  currentXOffset: number;
  currentYOffset: number;
  linePositionX: number;
}

interface ITimeIntervals {
  linePosition: number;
  currentSecond: number;
}

export default class TimelineStage extends Component<
  TimelineStateProps,
  TimelineStageState
> {
  private minPixelsInSecond: number = 5;
  private leftCanvasMargin: number = 10;

  public readonly state: TimelineStageState = {
    zoom: 1,
    currentXOffset: 0,
    currentYOffset: 0,
    linePositionX: 0
  };

  private generateTimeIntervals(): ITimeIntervals[] {
    const { zoom } = this.state;

    let linePosition: number = 0;
    let currentSecond: number = 0;

    const intervalData: ITimeIntervals[] = [];

    while (linePosition < 30000) {
      intervalData.push({ linePosition, currentSecond });

      currentSecond++;
      linePosition += this.minPixelsInSecond * zoom;
    }

    // console.log("CURRENTLY 1 second = ", this.minPixelsInSecond * zoom, "px");
    // console.log("CURRENT zoom is", zoom);

    return intervalData;
  }

  private handleTimelineWheel = (event: KonvaEventObject<WheelEvent>): void => {
    // @ts-ignore
    const isZoomIn: boolean = event.evt.wheelDeltaY > 0 ? true : false;

    if (!event.evt.shiftKey)
      return;

    this.setState((prevState: TimelineStageState) => ({
      zoom: isZoomIn
        ? prevState.zoom + 1
        : prevState.zoom === 1
        ? 1
        : prevState.zoom - 1
    }));
  };

  public componentDidUpdate(_: TimelineStateProps, prevState: TimelineStageState): void
  {
    const { zoom, linePositionX } = this.state;

    if (prevState.zoom !== zoom)
    {
      this.setState({ linePositionX: (prevState.linePositionX / (this.minPixelsInSecond * prevState.zoom)) * (this.minPixelsInSecond * zoom) })
    }
  }

  private handleDragBound = (position: Vector2d): Vector2d => {
    const boundX: number = position.x > 0 ? 0 : position.x

    this.updateCurrentOffset(boundX, 0)
    
    return {
      x: boundX,
      y: 0
    };
  }

  private updateCurrentOffset = (xPos: number, yPos: number): void =>
  {
    this.setState({ currentXOffset: xPos, currentYOffset: yPos });
  }

  private generateTimeLabel(time: number): string {
    if (time === 0) return time.toString();

    const minutes: number = Math.floor(time / 60);
    const seconds: number = time - minutes * 60;

    return (
      this.strPad(minutes.toString(), "0", 2) +
      ":" +
      this.strPad(seconds.toString(), "0", 2)
    );
  }

  private strPad(string: string, pad: string, length: number): string {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  }

  private getLabelsPerZoom(): number {
    const { zoom } = this.state;

    let labelsPerZoom: number = 1;

    if (zoom < 5) 
      labelsPerZoom = 8;
    else if (zoom >= 5 && zoom < 10) 
      labelsPerZoom = 4;
    else 
      labelsPerZoom = 1;

    return labelsPerZoom;
  }

  private isTimelineInView = (linePosition: number): boolean =>
  {
    const { currentXOffset } = this.state;
    const { width } = this.props;

    // Is line X position is within current viewport
    return (linePosition >= Math.abs(currentXOffset) && linePosition < Math.abs(currentXOffset) + width)
  }

  private handleLineDragMove = (e: KonvaEventObject<DragEvent>) => 
  {
    const { currentXOffset } = this.state;

    // Prevents active line from going below 0 seconds on the timeline.
    const boundLineX: number = e.evt.offsetX < this.leftCanvasMargin ?
      0 :
      Math.abs(e.evt.offsetX) + Math.abs(currentXOffset) - this.leftCanvasMargin;

    this.setState({ linePositionX: boundLineX })
  }

  public render(): ReactNode {
    const { width, height } = this.props;
    const { currentXOffset, linePositionX } = this.state;

    return (
      <div style={{ backgroundColor: "darkgrey" }}>
        <Stage
          width={width}
          height={height}
          draggable={true}
          onWheel={this.handleTimelineWheel}
          dragBoundFunc={this.handleDragBound}
        >
          <Layer draggable onDragMove={this.handleLineDragMove} dragBoundFunc={() => ({x: 0, y: 0})}>
            <Rect x={0} y={0} offsetX={currentXOffset} width={width} height={50} fill="white" />

            {this.generateTimeIntervals().map(
              (
                { linePosition, currentSecond }: ITimeIntervals,
                index: number
              ) => {
                const timeLabel: string = this.generateTimeLabel(currentSecond);

                if (index % this.getLabelsPerZoom() === 0 && this.isTimelineInView(linePosition)) {
                  return (
                    <Fragment key={linePosition.toString() + index.toString()}>
                      <Line
                        x={linePosition + this.leftCanvasMargin}
                        points={[0, 20, 0, 0, 0, 0, 0, 0]}
                        stroke="black"
                      />
                      <Text
                        x={linePosition - 3 + this.leftCanvasMargin}
                        y={30}
                        text={timeLabel}
                        fill="black"
                      />

                      <Line
                        x={linePosition + this.leftCanvasMargin}
                        y={50}
                        points={[0, 600, 0, 0, 0, 0, 0, 0]}
                        stroke="white"
                      />
                    </Fragment>
                  );
                }

                return null;
              }
            )}

            <Line x={linePositionX} y={0} points={[this.leftCanvasMargin, 0, this.leftCanvasMargin, 600]} stroke="blue" />
          </Layer>
        </Stage>
      </div>
    );
  }
}