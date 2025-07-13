"use client";

import React, { FC } from "react";
import {
  useVideoPlayerContext,
  VideoPlayerProvider,
} from "./VideoPlayerContext";
import VideoElement from "./_components/VideoElement";
import "video.js/dist/video-js.css";
import ControlPlayer from "./_components/ControlPlayer";
import VideoOverlay from "./_components/VideoOverlay";

interface SubtitleTrack {
  kind: "subtitles" | "captions";
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}

export interface VideoChapter {
  time: number;
  title: string;
  description?: string;
}

export interface VideoPlayerProps {
  source: Array<{ src: string; type: "application/x-mpegURL" }>; // support multiple formats
  poster?: string;
  autoplay?: boolean;
  muted?: boolean;
  vttUrl?: string;
  preload?: "auto" | "metadata" | "none";
  subtitles?: SubtitleTrack[];
  chapters?: VideoChapter[];
}

type VideoPlayerWithProps = VideoPlayerProps & {
  width?: number;
};

const VideoPlayer: FC<VideoPlayerWithProps> = (props) => {

  return (
    <VideoPlayerProvider {...props}>
      <CustomPlayer width={props.width} />
    </VideoPlayerProvider>
  );
};

export default VideoPlayer;

const CustomPlayer = ({ width }: { width?: number }) => {
  const { containerRef } = useVideoPlayerContext();


  return (
    <div
      ref={containerRef}
      className="relative group w-full bg-black rounded-lg overflow-hidden"
      style={{ maxWidth: width ? `${width}px` : "1280px" }}
    >
      <VideoElement />
      <VideoOverlay />
      <ControlPlayer />
    </div>
  );
};
