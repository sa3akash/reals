import React from "react";
import { useVideoPlayerContext } from "../VideoPlayerContext";
import { cn } from "@/lib/utils";

const VideoOverlay = () => {
  const { isPlaying, togglePlay } = useVideoPlayerContext();

  return (
    <button
      className={cn(
        "absolute inset-0 flex items-center justify-center group/play cursor-pointer",
        {
          hidden: isPlaying,
        }
      )}
      aria-label="Play video"
      onClick={togglePlay}
    >
      <div className="relative">
        {/* Outer circle (play button) */}
        <div className="aspect-square w-16 sm:w-20 md:w-24 lg:w-28 bg-primary/90 rounded-full flex items-center justify-center shadow-2xl group-hover/play:bg-primary group-hover/play:scale-110 transition-all duration-300 backdrop-blur-sm">
          {/* Triangle play icon */}
          <div className="w-0 h-0 border-l-[16px] sm:border-l-[20px] md:border-l-[24px] lg:border-l-[28px] border-l-white border-y-[10px] sm:border-y-[14px] md:border-y-[16px] lg:border-y-[20px] border-y-transparent ml-[2px]" />
        </div>

        {/* Ping animation */}
        <div className="absolute inset-0 aspect-square w-16 sm:w-20 md:w-24 lg:w-28 bg-primary/20 rounded-full animate-ping" />
      </div>
    </button>
  );
};

export default VideoOverlay;
