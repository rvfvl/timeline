import React, { Component } from 'react';
import TimelineStage from "./TimelineStage";

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

  public render()
  {
    const { width } = this.state;

    return (
      <div ref={this.stageRef}>
        <TimelineStage width={width} height={500} />
      </div>
    )
  }
}
