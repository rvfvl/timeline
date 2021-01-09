/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";

let test: any;

const Play = () =>
{
  const [count, setCount] = React.useState(0);
  const [active, setActive] = React.useState(false);

  React.useLayoutEffect(() =>
  {
    const currPosition: number = count;

    if (active)
    {
      let handler: any;

      const currTime = new Date().getTime();

      const animate = (_: number, currTime: number, currPos: number) =>
      {

        const runtime = new Date().getTime() - currTime;
        const progress = (runtime / 1000) * 1;
        
        console.log(currPosition)
        setCount((prev) => currPosition + 200 * progress);

        handler = requestAnimationFrame((timestamp) => animate(timestamp, currTime, currPos));
      };

      handler = requestAnimationFrame((timestamp) => animate(timestamp, currTime, currPosition));

      return () => cancelAnimationFrame(handler)
    }


  }, [active]);

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex" }}>
        {Array.from(Array(10).keys()).map((i) => (
          <div
            style={{
              transform: `translateX(${i * 200}px)`,
              width: 1,
              backgroundColor: "red",
              height: 100
            }}
          ></div>
        ))}
        <div
          style={{
            transform: `translateX(${count}px)`,
            width: 1,
            backgroundColor: "blue",
            height: 100,
            left: 0,
            position: "absolute"
          }}
        ></div>
      </div>
      <button onClick={() => setActive(true)}>start</button>
      <button onClick={() => setActive(false)}>start</button>
      {active ? "TRUE" : "FALSE"}
    </div>
  );
};

export default Play;
