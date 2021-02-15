import Konva from "konva";
import { Group } from "konva/types/Group";
import { KonvaEventObject, Node } from "konva/types/Node"
import React, { Component, RefObject } from 'react'
import { Rect, Shape } from "react-konva"
import { IKeyframe, ISingleMappedRef } from "./TimelineStage";

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
  //nextKeyframe?: IKeyframe;
  //nextKeyframeId?: Node;
  id: string;
  //groupArr: any[];

  currentKeyframe: ISingleMappedRef | null;
  nextKeyframe: ISingleMappedRef | null;
  prevKeyframe: ISingleMappedRef | null;

  stageRef: React.RefObject<Konva.Stage>;

  keyframeGroupRef: RefObject<Konva.Group>;
}

export default class TimelineProperty extends Component<TimelinePropertyProps> {

  private keyframeRef: RefObject<Konva.Rect> = React.createRef();
  private control1: RefObject<Konva.Rect> = React.createRef();
  private control2: RefObject<Konva.Rect> = React.createRef();


  state = {
    x: 0,
    y: 0, ref: null
  }


  private handleDragMove2 = (e: KonvaEventObject<DragEvent>) =>
  {
    console.log("e.target.getPosition()", e.target.getPosition())
    console.log("e.target.getAbsolutePosition()", e.target.getAbsolutePosition())
    console.log("{ x: e.target.x(), y: e.target.y() }", { x: e.target.x(), y: e.target.y() })
  }

  //@ts-ignore
//   private calculateBezier = (p0, p1, p2, p3, t) => {
//     var ret = {};
//     var coords = ['x', 'y'];
//     var i, k;

//     for (i in coords) {
//         k = coords[i];
//         //@ts-ignore
//         ret[k] = Math.pow(1 - t, 3) * p0[k] + 3 * Math.pow(1 - t, 2) * t * p1[k] + 3 * (1 - t) * Math.pow(t, 2) * p2[k] + Math.pow(t, 3) * p3[k];
//     }

//     return ret;
// }

  private calculateHandlePosition()
  {
    const { currentKeyframe, nextKeyframe } = this.props;

    if (!currentKeyframe || !nextKeyframe)
      return 0;

    const currentXPos: number = currentKeyframe?.ref.current?.x() ?? 0;
    const difference: number = (nextKeyframe?.ref.current?.x() ?? 0) - currentXPos;

    // return currentXPos + (difference * currentKeyframe.handles.c1)
    console.log(currentKeyframe.id)

    return currentXPos;
  }

  private onRefChange = (node: Konva.Rect | null) =>
  {
    const { currentKeyframe, stageRef } = this.props


      //@ts-ignore
    currentKeyframe.ref = node;

    console.log("REF CHANGED")

    this.setState({ ref: currentKeyframe?.ref ?? null })
    stageRef.current?.draw()
  }

  render()
  {
    const { handlePropertyDragEnd, propertyIndex, secondIndex, second, minPixelsInSecond, nextKeyframe, zoom, id, currentKeyframe, prevKeyframe, } = this.props;
    console.log(currentKeyframe?.ref ?? 0)

    return (
      <>
        {
          this.state.ref && nextKeyframe && (
            <Shape
              stroke={'yellow'}
              strokeWidth={1}
              offsetX={-10}
              offsetY={10}
              sceneFunc={(ctx, shape) =>
              {
                ctx.beginPath();
                // @ts-ignore
                ctx.moveTo(currentKeyframe?.ref?.x() ?? 0, currentKeyframe?.ref.y() ?? 0);
                ctx.bezierCurveTo(
                  // @ts-ignore
                  currentKeyframe?.c2Ref.current.getPosition().x,
                  // @ts-ignore
                  currentKeyframe?.c2Ref.current.getPosition().y,
                  // @ts-ignore
                  nextKeyframe?.c1Ref.current.getPosition().x,
                  // @ts-ignore
                  nextKeyframe?.c1Ref.current.getPosition().y,
                  // @ts-ignore
                  nextKeyframe.ref.getPosition().x,
                  // @ts-ignore
                  nextKeyframe.ref.getPosition().y
                );

                // @ts-ignore
                //ctx.lineTo(this.state.ref.getPosition().x, this.state.ref.getPosition().x)

                ctx.fillStrokeShape(shape);


                // console.log(this.calculateHandlePosition())

                // const res: any = this.calculateBezier(
                //   {x: this.keyframeRef?.current?.x(), y: this.keyframeRef?.current?.y()},
                //   {x: this.control1.current?.x() ?? 0, y: this.control1.current?.y() ?? 0},
                //   {x: this.control2.current?.x() ?? 0, y: this.control2.current?.y() ?? 0},
                //   {x: groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().x ?? 0, y: groupArr[propertyIndex][secondIndex + 1]?.keyframeRef?.current?.getPosition().y ?? 0},
                //   0.01,
                // );

                // this.setState({ x: res.x, y: res.y })
              }}
            />
          )
        }
      {/* <Rect
          ref={this.keyframeRef}
          x={this.state.x}
          offsetX={20}
          offsetY={5}
          y={this.state.y}
          width={10} height={10}
          fill="pink"
        /> */}

        <Rect
          ref={this.onRefChange}
          draggable
          onDragEnd={(e: KonvaEventObject<DragEvent>) => handlePropertyDragEnd(e, propertyIndex, secondIndex)}
          onDragMove={() => {
            // @ts-ignore
            currentKeyframe?.c1Ref.current.x((currentKeyframe?.ref.x() ?? 0) - 30)
            // @ts-ignore
            currentKeyframe?.c1Ref.current.y((currentKeyframe?.ref.y() ?? 0) ?? 0)

            // @ts-ignore
            currentKeyframe?.c2Ref.current.x((currentKeyframe?.ref.x() ?? 0) + 30)
            // @ts-ignore
            currentKeyframe?.c2Ref.current.y((currentKeyframe?.ref.y() ?? 0) ?? 0)

            console.log("CURRENT", currentKeyframe)
            console.log("PREV", prevKeyframe)
            console.log("NEXT", nextKeyframe)
          }}
          dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
          x={(second.second * (minPixelsInSecond * zoom))}
          offsetX={20}
          offsetY={5}
          y={200 - (second.value * 50) + 10}
          width={10} height={10}
          fill="red"
          rotation={135}
          id={id}
        />

        {this.state.ref && (
          <Rect
          ref={currentKeyframe?.c1Ref}
          draggable

          // onDragMove={() => this.control1.current?.x(keyframeGroupRef.current?.findOne(`#${id}`)?.x() ?? 0)}
          // dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
        // @ts-ignore
          x={(currentKeyframe.ref.x() ?? 0) - 30}
          offsetX={10}
          offsetY={0}
           // @ts-ignore
          y={(currentKeyframe.ref.y() ?? 0)}
          width={10} height={10}
          fill="blue"
          rotation={135}
          id={id}
        />
        )}
        {this.state.ref && (
          <Rect
          ref={currentKeyframe?.c2Ref}
            draggable
            // onDragEnd={(e: KonvaEventObject<DragEvent>) => handlePropertyDragEnd(e, propertyIndex, secondIndex)}
            
            // dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
            // @ts-ignore
            x={(currentKeyframe.ref.x() ?? 0) + 30}
            
            offsetY={0}
            y={200 - (second.value * 50) + 10}
            width={10} height={10}
            fill="green"
            rotation={135}
            id={id}
          />
        )}
        

      </>
    )
  }
}
