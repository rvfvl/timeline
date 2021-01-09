import Konva from "konva";
import { Group } from "konva/types/Group";
import { KonvaEventObject, Node } from "konva/types/Node"
import React, { Component, RefObject } from 'react'
import { Rect, Shape } from "react-konva"
import { IKeyframe } from "./TimelineStage";

interface TimelinePropertyProps
{
  handlePropertyDragEnd: (e: KonvaEventObject<DragEvent>, index: number, secondIndex: number) => void;
  propertyIndex: number;
  second: IKeyframe;
  secondIndex: number;
  zoom: number;
  minPixelsInSecond: number;
  leftCanvasMargin: number;
  minPropertyYPos: number;
  curveLineRef: RefObject<Konva.Line>;
  nextKeyframe?: IKeyframe;
  nextKeyframeId?: Node;
  id: string;
  groupArr: any[];
}

export default class TimelineProperty extends Component<TimelinePropertyProps> {

  private keyframeRef: RefObject<Konva.Rect> = React.createRef();
  private control1: RefObject<Konva.Rect> = React.createRef();
  private control2: RefObject<Konva.Rect> = React.createRef();

  state = {
    x: 0,
    y: 0
  }

  private handleDragMove2 = (e: KonvaEventObject<DragEvent>) =>
  {
    console.log("e.target.getPosition()", e.target.getPosition())
    console.log("e.target.getAbsolutePosition()", e.target.getAbsolutePosition())
    console.log("{ x: e.target.x(), y: e.target.y() }", { x: e.target.x(), y: e.target.y() })
  }

  //@ts-ignore
  private calculateBezier = (p0, p1, p2, p3, t) => {
    var ret = {};
    var coords = ['x', 'y'];
    var i, k;

    for (i in coords) {
        k = coords[i];
        //@ts-ignore
        ret[k] = Math.pow(1 - t, 3) * p0[k] + 3 * Math.pow(1 - t, 2) * t * p1[k] + 3 * (1 - t) * Math.pow(t, 2) * p2[k] + Math.pow(t, 3) * p3[k];
    }

    return ret;
}

  render()
  {
    const { handlePropertyDragEnd, propertyIndex, secondIndex, second, minPixelsInSecond, nextKeyframe, zoom, groupArr, id } = this.props;


    return (
      <>
        {
          nextKeyframe && (
            <Shape
              stroke={'yellow'}
              strokeWidth={1}
              offsetX={-10}
              offsetY={10}
              sceneFunc={(ctx, shape) =>
              {
                ctx.beginPath();
                ctx.moveTo(this.keyframeRef?.current?.x(), this.keyframeRef?.current?.y());
                ctx.bezierCurveTo(
                  this.control1.current?.x() ?? 0,
                  this.control1.current?.y() ?? 0,
                  this.control2.current?.x() ?? 0,
                  this.control2.current?.y() ?? 0,
                  groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().x ?? 0,
                  groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().y ?? 0
                );
                ctx.fillStrokeShape(shape);

                const res: any = this.calculateBezier(
                  {x: this.keyframeRef?.current?.x(), y: this.keyframeRef?.current?.y()},
                  {x: this.control1.current?.x() ?? 0, y: this.control1.current?.y() ?? 0},
                  {x: this.control2.current?.x() ?? 0, y: this.control2.current?.y() ?? 0},
                  {x: groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().x ?? 0, y: groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().y ?? 0},
                  0.01,
                );

                console.log(this.calculateBezier(
                  {x: this.keyframeRef?.current?.x(), y: this.keyframeRef?.current?.y()},
                  {x: this.control1.current?.x() ?? 0, y: this.control1.current?.y() ?? 0},
                  {x: this.control2.current?.x() ?? 0, y: this.control2.current?.y() ?? 0},
                  {x: groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().x ?? 0, y: groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().y ?? 0},
                  1,
                ))

                this.setState({ x: res.x, y: res.y })
              }}
            />
          )
        }
      <Rect
          ref={this.keyframeRef}
          x={this.state.x}
          offsetX={20}
          offsetY={5}
          y={this.state.y}
          width={10} height={10}
          fill="pink"
        />

        <Rect
          ref={this.keyframeRef}
          draggable
          onDragEnd={(e: KonvaEventObject<DragEvent>) => handlePropertyDragEnd(e, propertyIndex, secondIndex)}
          //onDragMove={this.handleDragMove}
          dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
          x={(second.second * (minPixelsInSecond * zoom))}
          offsetX={20}
          offsetY={5}
          y={200 - (second.value * 50) + 10}
          width={10} height={10}
          fill="black"
          rotation={135}
          id={id}
        />

        <Rect
          ref={this.control1}
          draggable
          // onDragEnd={(e: KonvaEventObject<DragEvent>) => handlePropertyDragEnd(e, propertyIndex, secondIndex)}
          //onDragMove={this.handleDragMove}
          // dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
          x={(second.second * (minPixelsInSecond * zoom))}
          offsetX={10}
          offsetY={0}
          y={200 - (second.value * 50) + 10}
          width={10} height={10}
          fill="blue"
          rotation={135}
          id={id}
        />
        <Rect
          ref={this.control2}
          draggable
          // onDragEnd={(e: KonvaEventObject<DragEvent>) => handlePropertyDragEnd(e, propertyIndex, secondIndex)}
          
          // dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
          x={(second.second * (minPixelsInSecond * zoom))}
          
          offsetY={0}
          y={200 - (second.value * 50) + 10}
          width={10} height={10}
          fill="blue"
          rotation={135}
          id={id}
        />

      </>
    )
  }
}
