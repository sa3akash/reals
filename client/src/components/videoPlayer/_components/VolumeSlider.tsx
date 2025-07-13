import React from "react";
import { useVideoPlayerContext } from "../VideoPlayerContext";

const VolumeSlider = () => {
  const { volume, handleChangeVolume } = useVideoPlayerContext();

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={handleChangeVolume}
        className="w-24 h-1 bg-white/40 rounded appearance-none cursor-pointer"
      />
      <span className="text-xs text-white">{Math.round(volume * 100)}%</span>
    </div>
  );
};

export default VolumeSlider;
