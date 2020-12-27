import Konva from "konva";
import { KonvaEventObject } from "konva/types/Node";
import { Vector2d } from "konva/types/types";
import React, { Component, Fragment, ReactNode, RefObject } from "react";
import { Stage, Layer, Line, Text, Rect, Group } from "react-konva";
import TimelineProperty from "./TimelineProperty";

interface TimelineStateProps {
  width: number;
  height: number;
}

interface TimelineStageState {
  zoom: number;
  isDraggingKey: boolean;
  currentXOffset: number;
  currentYOffset: number;
  linePositionX: number;
  mode: string;
  properties: IAnimationProperty[];
}

interface IAnimationProperty
{
  name: string;
  keyframes: IKeyframe[];
}

export interface IKeyframe
{
  second: number; value: number;
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

  private curveLineRef: RefObject<Konva.Line> = React.createRef();

  public readonly state: TimelineStageState = {
    zoom: 1,
    isDraggingKey: false,
    currentXOffset: 0,
    currentYOffset: 0,
    linePositionX: 0,
    mode: "keyframe",
    properties: [
      { name: "scale", keyframes: [{
        second: 2, value: 0
      }] },
      { name: "transform", keyframes: [{
        second: 0, value: 1
      }, {
        second: 40, value: 3
      }, {
        second: 43, value: 3
      }, {
        second: 50, value: 3
      }, {
        second: 55, value: 2
      }] }
    ]
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

    return intervalData;
  }

  private handleTimelineWheel = (event: KonvaEventObject<WheelEvent>): void => {
    // @ts-ignore
    const isZoomIn: boolean = event.evt.wheelDeltaY > 0 ? true : false;

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
    const { zoom } = this.state;

    if (prevState.zoom !== zoom)
    {
      this.setState({ linePositionX: (prevState.linePositionX / (this.minPixelsInSecond * prevState.zoom)) * (this.minPixelsInSecond * zoom) })
    }
  }

  private handleDragBound = (position: Vector2d): Vector2d => {
    const boundX: number = position.x > 0 ? 0 : position.x

    this.updateCurrentOffset(boundX, position.y)
    
    return {
      x: boundX,
      y: position.y
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

  private handlePropertyDragEnd = (e: KonvaEventObject<DragEvent>, index: number, secondIndex: number): void =>
  {
    const { properties, zoom, currentXOffset } = this.state;

    const propertiesArr = [...properties];

    const itemXPos: number = e.target._lastPos.x + Math.abs(currentXOffset);
    const itemYPos: number = ((this.curveLineRef.current?.getAbsolutePosition().y ?? 0) - e.target.getAbsolutePosition().y + 10) / 100

    const snapToSecond: number = Math.round(itemXPos / (zoom * this.minPixelsInSecond));

    console.log("Y POS ", itemYPos)

    propertiesArr[index].keyframes = propertiesArr[index].keyframes.map((second: IKeyframe, index: number) => index === secondIndex ? {
      second: snapToSecond,
      value: itemYPos
    } : second);

    // console.log(propertiesArr)
    this.setState({properties: []})
    this.setState((prevState: TimelineStageState) => ({ properties: propertiesArr, isDraggingKey: !prevState.isDraggingKey }))
  }

  public render(): ReactNode {
    const { width, height } = this.props;
    const { currentXOffset, linePositionX, properties, zoom, currentYOffset, mode } = this.state;

    const minPropertyYPos: number = 75;

    return (
      <div style={{ backgroundColor: "darkgrey" }}>
        <Stage
          width={width}
          height={height}
          draggable={true}
          onWheel={this.handleTimelineWheel}
          dragBoundFunc={this.handleDragBound}
        >
          <Layer>
            <Group offsetX={-10} offsetY={currentYOffset}>
              <Rect x={0} y={0} offsetX={currentXOffset + 10}  width={width} height={50} fill="white" draggable={true} onDragMove={this.handleLineDragMove} dragBoundFunc={() => ({x: currentXOffset, y: 0})} />

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
                          x={linePosition}
                          points={[0, 20, 0, 0, 0, 0, 0, 0]}
                          stroke="black"
                        />
                        <Text
                          x={linePosition}
                          y={30}
                          text={timeLabel}
                          fill="black"
                        />

                        <Line
                          x={linePosition}
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


              
            </Group>

            {properties.map((property: IAnimationProperty, index: number) => (
                property.keyframes.map((second: IKeyframe, secondIndex: number) => {
                  if (mode === "keyframe")
                  {
                    return (
                      <Rect
                        draggable
                        onDragEnd={(e: KonvaEventObject<DragEvent>) => this.handlePropertyDragEnd(e, index, secondIndex)}
                        onDragMove={(e) => console.log(e.target.getPosition().x)}
                        dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
                        x={(second.second * (this.minPixelsInSecond * zoom))} 
                        offsetX={20} offsetY={5} y={minPropertyYPos + index * 35} 
                        width={10} height={10} 
                        fill="black" 
                        rotation={135}  
                      />
                    )
                  }

                  return (
                    <TimelineProperty 
                      handlePropertyDragEnd={this.handlePropertyDragEnd}
                      propertyIndex={index}
                      secondIndex={secondIndex}
                      second={second}
                      zoom={zoom}
                      minPixelsInSecond={this.minPixelsInSecond}
                      leftCanvasMargin={this.leftCanvasMargin}
                      minPropertyYPos={minPropertyYPos}
                      curveLineRef={this.curveLineRef}
                    />
                  )
                })
              ))}

            {mode === "curve" && (
              <Line ref={this.curveLineRef} x={0} y={200} points={[width, 0, 0, 0, 0, 0, 0, 0]} stroke="red" />
            )}

            <Line offsetX={-10} offsetY={currentYOffset} x={linePositionX} y={0} points={[0, 0, 0, 600]} stroke="blue" />
          </Layer>
        </Stage>
        {"x: " + currentXOffset}
        {"y: " + currentYOffset}
        <button onClick={() => this.setState({ mode: "keyframe"})}>KEYFRAME</button>
        <button onClick={() => this.setState({ mode: "curve"})}>CURVE</button>
      </div>
    );
  }
}
