import React from "react";

const VideoOverlay = () => {
  return (
    <button
      className="absolute inset-0 flex items-center justify-center group/play z-10 cursor-pointer"
      aria-label="Play video"
    >
      <div className="relative">
        <div className="w-20 h-20 sm:w-28 sm:h-28 bg-primary/90 rounded-full flex items-center justify-center shadow-2xl group-hover/play:bg-primary group-hover/play:scale-110 transition-all duration-300 backdrop-blur-sm">
          <div className="w-0 h-0 border-l-[20px] sm:border-l-[28px] border-l-white border-y-[14px] sm:border-y-[20px] border-y-transparent ml-1" />
        </div>
        <div className="absolute inset-0 w-20 h-20 sm:w-28 sm:h-28 bg-primary/20 rounded-full animate-ping"></div>
      </div>
    </button>
  );
};

export default VideoOverlay;
