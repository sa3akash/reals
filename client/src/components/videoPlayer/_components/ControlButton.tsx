import { Button } from "@/components/ui/button";
import React from "react";
import { Icon } from "./icon";
import { useVideoPlayerContext } from "../VideoPlayerContext";
import VolumeSlider from "./VolumeSlider";

const ControlButton = () => {
  const {
    togglePlay,
    isPlaying,
    toggleFullscreen,
    toggleMute,
    isMuted,
    isFullscreen,
    formatTime,
    currentTime,
    duration,
    seekToSeconds,
  } = useVideoPlayerContext();

  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-x-2">
        <Button
          variant="icon"
          size="icon"
          onClick={() => seekToSeconds(-15)}
          className="hover:scale-110 transition-transform"
        >
          <Icon.ChevronLeftIcon className="size-4 md:size-6" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={togglePlay}
          className="hover:scale-110 transition-transform"
        >
          {isPlaying ? (
            <Icon.PauseIcon className="size-4 md:size-6" />
          ) : (
            <Icon.PlayIcon className="size-4 md:size-6" />
          )}
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={() => seekToSeconds(15)}
          className="hover:scale-110 transition-transform"
        >
          <Icon.ChevronRightIcon className="size-4 md:size-6" />
        </Button>

        <span className="text-white text-xs font-medium min-w-[35px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <Button
          variant="icon"
          size="icon"
          onClick={toggleMute}
          className="hover:scale-110 transition-transform"
        >
          {isMuted ? (
            <Icon.VolumeXIcon className="size-4 md:size-6" />
          ) : (
            <Icon.VolumeIcon className="size-4 md:size-6" />
          )}
        </Button>
        <VolumeSlider />
      </div>
      <div className="flex items-center gap-x-2">
        <Button variant="icon" size="icon">
          <Icon.SettinsIcon className="size-4 md:size-6" />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={toggleFullscreen}
          className="hover:scale-110 transition-transform"
        >
          {isFullscreen ? (
            <Icon.FullScreenOffIcon className="size-4 md:size-6" />
          ) : (
            <Icon.FullScreenIcon className="size-4 md:size-6" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ControlButton;
