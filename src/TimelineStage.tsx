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
  handles: {c1: number, c2: number};
  id: number;
}

interface ITimeIntervals {
  linePosition: number;
  currentSecond: number;
}

export type ISingleMappedRef = IKeyframe & { ref: RefObject<Konva.Rect>, c1Ref: RefObject<Konva.Rect>, c2Ref: RefObject<Konva.Rect> };

interface IMappedRefs 
{
  [key: string]: ISingleMappedRef[];
}

export default class TimelineStage extends Component<
  TimelineStateProps,
  TimelineStageState
> {
  private minPixelsInSecond: number = 5;
  private leftCanvasMargin: number = 10;

  private keyframesArr: any[] = [];

  private labelsRef: RefObject<Konva.Group> = React.createRef();

  private curveLineRef: RefObject<Konva.Line> = React.createRef();
  private keyframeGroupRef: RefObject<Konva.Group> = React.createRef();
  private stageRef: RefObject<Konva.Stage> = React.createRef();

  private keyframeRefs: IMappedRefs;


  public readonly state: TimelineStageState = {
    zoom: 1,
    isDraggingKey: false,
    currentXOffset: 0,
    currentYOffset: 0,
    linePositionX: 0,
    mode: "keyframe",
    properties: [
      { name: "scale", keyframes: [{
        id: 1, second: 2, value: 0, handles: {c1: 0.5, c2: 0.5}
      }] },
      { name: "transform", keyframes: [{
        id: 1, second: 0, value: 1, handles: {c1: 0.5, c2: 0.5}
      }, {
        id: 2, second: 40, value: 3, handles: {c1: 0.5, c2: 0.5}
      }, {
        id: 3, second: 50, value: 2, handles: {c1: 0.5, c2: 0.5}
      }] }
    ]
  };

  constructor(props: TimelineStateProps)
  {
    super(props);

    this.keyframeRefs = this.getKeyframeRefs();
  }

  private getKeyframeRefs = () =>
  {
    const { properties } = this.state;

    const mappedRefs: IMappedRefs = properties.reduce((acc: any, property) => {

      if (!acc[property.name])
        acc[property.name] = []

      const propertyRefs = property.keyframes.map((prop: IKeyframe) => ({
        ...prop,
        ref: React.createRef(),
        c1Ref: React.createRef(),
        c2Ref: React.createRef()
      }))

      acc[property.name].push(...propertyRefs)

      return acc;
    }, {})

    return mappedRefs;
  }

  private getKeyframeInProperty(propertyName: string, keyframeId: number): ISingleMappedRef | null
  {
    if (!(propertyName in this.keyframeRefs))
      return null;

    return this.keyframeRefs[propertyName].find((keyframe: ISingleMappedRef) => keyframe.id === keyframeId) ?? null;
  }

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

  public componentDidMount(): void
  {
    this.labelsRef.current?.zIndex(0)
    this.keyframeGroupRef.current?.zIndex(1)

    // console.log("labels ref z index", this.labelsRef.current?.zIndex())
    // console.log("keyframeGroupRef z index", this.keyframeGroupRef.current?.zIndex())
  }

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

    this.updateCurrentOffset(boundX, this.stageRef.current?.absolutePosition().y ?? 0)
    
    return {
      x: boundX,
      y: (this.stageRef.current?.absolutePosition().y ?? 0)
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
    const itemYPos: number = ((this.curveLineRef.current?.getAbsolutePosition().y ?? 0) - e.target.getAbsolutePosition().y + 10) / 50

    const snapToSecond: number = Math.round(itemXPos / (zoom * this.minPixelsInSecond));

    console.log("Y POS ", itemYPos)

    propertiesArr[index].keyframes = propertiesArr[index].keyframes.map((second: IKeyframe, index: number) => index === secondIndex ? {
      ...second,
      second: snapToSecond,
      value: itemYPos
    } : second);

    // console.log(propertiesArr)
    this.setState({properties: []})
    this.setState((prevState: TimelineStageState) => ({ properties: propertiesArr, isDraggingKey: !prevState.isDraggingKey }))
  }

  private handleWheel = (e: React.UIEvent<Element, UIEvent>) =>
  {
    const { currentYOffset } = this.state

    const el = document.getElementById("area");
    

    const val: number = (el?.scrollTop ?? 0) + currentYOffset


    console.log("VAL", val)

    this.stageRef.current?.offsetY(el?.scrollTop ?? 0)
    this.stageRef.current?.draw()

    console.log("LABELS REF", this.stageRef.current?.offsetY())
    //this.setState((prev: TimelineStageState) => ({ currentYOffset: val }));

  }

  public render(): ReactNode {
    const { width, height } = this.props;
    const { currentXOffset, linePositionX, properties, zoom, currentYOffset, mode } = this.state;

    const minPropertyYPos: number = 75;

    return (
      <div style={{ backgroundColor: "darkgrey" }}>
        <div id="area" onScroll={this.handleWheel} style={{border: "1px solid black", height: 200, width: 1000, overflow: "scroll"}}><div style={{height: 1000, width: 1000}}></div></div>
        <Stage
          ref={this.stageRef}
          width={width}
          height={height}
          draggable={true}
          onWheel={this.handleTimelineWheel}
          dragBoundFunc={this.handleDragBound}
        >
          <Layer>
            <Group offsetX={-10} x={0} y={0} offsetY={this.stageRef.current?.offsetY() ?? 0} ref={this.labelsRef}>
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

            <Group ref={this.keyframeGroupRef} onDragMove={() => {
              console.log("ESSA")
            }}> 
              {properties.map((property: IAnimationProperty, index: number) => (
                property.keyframes.map((second: IKeyframe, secondIndex: number) => {
                  this.keyframesArr[index] = []

                  if (mode === "keyframe")
                  {
                    return (
                      <Rect
                        ref={(node) => this.keyframesArr[index][secondIndex] = node}
                        draggable
                        onDragEnd={(e: KonvaEventObject<DragEvent>) => this.handlePropertyDragEnd(e, index, secondIndex)}
                        onDragMove={(e) => console.log(e.target.getPosition().x)}
                        dragBoundFunc={(pos) => {
                          console.log("POS", this.keyframesArr[index][secondIndex].getAbsolutePosition())

                          return { x: pos.x, y: this.keyframesArr[index][secondIndex].getAbsolutePosition().y  }
                        }}
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
                      // ref={(node) => this.keyframesArr[index][secondIndex] = node}
                      handlePropertyDragEnd={this.handlePropertyDragEnd}
                      propertyIndex={index}
                      secondIndex={secondIndex}
                      keyframeGroupRef={this.keyframeGroupRef}
                      second={second}
                      zoom={zoom}
                      id={`#${index}-${secondIndex}`}
                      minPixelsInSecond={this.minPixelsInSecond}
                      leftCanvasMargin={this.leftCanvasMargin}
                      minPropertyYPos={minPropertyYPos}
                      curveLineRef={this.curveLineRef}
                      // nextKeyframe={property.keyframes[secondIndex + 1]}
                      // groupArr={this.keyframesArr}
                      stageRef={this.stageRef}
                      currentKeyframe={this.getKeyframeInProperty(property.name, second.id)}
                      nextKeyframe={this.getKeyframeInProperty(property.name, second.id + 1)}
                      prevKeyframe={this.getKeyframeInProperty(property.name, second.id - 1)}
                    />
                  )
                })
              ))}
            </Group>

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
