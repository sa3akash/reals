import React, {  } from "react";
import { useVideoPlayerContext } from "../VideoPlayerContext";

const VideoElement = () => {
  const { videoRef, togglePlay, isPlaying } = useVideoPlayerContext();

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-big-play-centered w-full !h-full"
        playsInline
        onClick={togglePlay}
        style={{ cursor: isPlaying ? "default" : "pointer" }}
      />
    </div>
  );
};

export default VideoElement;
