import React from "react";
import TimeLine from "./TimeLine";
import ControlButton from "./ControlButton";

const ControlPlayer = () => {
  return (
    <>
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      <div className="absolute bottom-0 inset-x-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 ">
        <TimeLine />
        <ControlButton />
      </div>
    </>
  );
};

export default ControlPlayer;
