import React, { Component } from 'react';
import TimelineStage from "./TimelineStage";
import {Stage, Layer, Rect, Shape} from "react-konva"
import Konva from "konva";
import Play from "./Play";

interface IState
{
  width: number;
  height: number;
}

export default class App extends Component<{}, IState>
{
  private stageRef = React.createRef<HTMLDivElement>();

  public readonly state: IState = {
    width: 0,
    height: 0
  }

  public componentDidMount(): void
  {
    this.handleResize();

    window.addEventListener("resize", this.handleResize)
  }

  public componentWillUnmount(): void
  {
    window.removeEventListener("resize", this.handleResize)
  }

  private handleResize = (): void =>
  {
    this.setState({
      width: this.stageRef.current?.clientWidth ?? 0,
      height: this.stageRef.current?.clientHeight ?? 0
    })
  }

  private rect1Ref = React.createRef<Konva.Rect>();
  private rect2Ref = React.createRef<Konva.Rect>();

  public render()
  {
    const { width } = this.state;

    return (
      <div ref={this.stageRef}>
        <TimelineStage width={width} height={500} />

        <Stage draggable width={1920} height={300} style={{border: "1px solid black", margin: "2rem"}}>
          <Layer>
          <Shape
            stroke="red"
            strokeWidth={1}
            offsetX={-7.5}
            offsetY={-7.5}
            sceneFunc={(ctx, shape) => {
              ctx.beginPath();
              ctx.moveTo(this.rect1Ref.current?.getPosition().x, this.rect1Ref.current?.getPosition().y);
              ctx.bezierCurveTo(
                50, //x1
                100, //y1
                100, //x2
                0, //y2
                this.rect2Ref.current?.getPosition().x,
                this.rect2Ref.current?.getPosition().y
              );
              ctx.fillStrokeShape(shape);
            }}
          />

            <Rect ref={this.rect1Ref} draggable width={15} height={15} x={0} y={0} fill="black" />

            <Rect ref={this.rect2Ref} onDragMove={(e) => {
              console.log("e.target.getPosition()", e.target.getPosition())
              console.log("e.target.getAbsolutePosition()", e.target.getAbsolutePosition())
              console.log("{ x: e.target.x(), y: e.target.y() }", { x: e.target.x(), y: e.target.y() })
            }} draggable width={15} height={15} x={100} y={50} fill="black" />
          </Layer>
        </Stage>

        <Play />
      </div>
    )
  }
}
