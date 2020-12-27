import Konva from "konva";
import { KonvaEventObject } from "konva/types/Node"
import { property } from "lodash"
import React, { Component, RefObject } from 'react'
import { Rect } from "react-konva"
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
}

export default class TimelineProperty extends Component<TimelinePropertyProps> {

  private handleDragMove = (e: KonvaEventObject<DragEvent>) =>
  {
    const { curveLineRef } = this.props;

    console.log("KEYFRAME POS,", e.target.getPosition());

    console.log('POS', ((curveLineRef.current?.getAbsolutePosition().y ?? 0) - e.target.getAbsolutePosition().y + 10) / 50)
  }

  render() {
    const { handlePropertyDragEnd, propertyIndex, secondIndex, second, minPixelsInSecond, minPropertyYPos, zoom, leftCanvasMargin } = this.props;

    return (
      <Rect
        draggable
        onDragEnd={(e: KonvaEventObject<DragEvent>) => handlePropertyDragEnd(e, propertyIndex, secondIndex)}
        onDragMove={this.handleDragMove}
        dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })}
        x={(second.second * (minPixelsInSecond * zoom))}
        offsetX={20}
        offsetY={5}
        y={200 - (second.value * 50) + 10} 
        width={10} height={10} 
        fill="black" 
        rotation={135}  
      />
    )
  }
}
