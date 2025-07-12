"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useCallback, useEffect, useRef, useState } from "react";
import Player from "video.js/dist/types/player";
import videojs from "video.js";
import { Button } from "../ui/button";
import { Icon } from "./_components/icon";
import TimeLine from "./_components/TimeLine";
import VideoOverlay from "./_components/VideoOverlay";
// import "videojs-contrib-quality-levels";

interface VideoSubtitle {
  kind: "subtitles" | "captions";
  src: string;
  srclang: string;
  label: string;
  default?: boolean;
}

interface VideoThumbnail {
  time: number;
  src: string;
}

interface VideoChapter {
  time: number;
  title: string;
  description?: string;
}

interface VideoPlayerProps {
  source: string;
  poster?: string;
  subtitles?: VideoSubtitle[];
  thumbnailVttUrl?: string;
  chapters?: VideoChapter[];
  title?: string;
  description?: string;
  autoplay?: boolean;
  muted?: boolean;
  preload?: "auto" | "metadata" | "none";
  onError?: (error: Error) => void;
  onAnalytics?: (event: string, data: any) => void;
  width?: number;
  height?: number;
}

const VideoPlayer = (props: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [buffered, setBuffered] = useState(0);

  const [availableQualities, setAvailableQualities] = useState<
    { height: number; bitrate: number; enabled: boolean }[]
  >([]);
  const [currentQuality, setCurrentQuality] = useState("Auto");
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoElement = videoRef.current;

    // Initialize video.js player
    const player = videojs(videoElement, {
      autoplay: props.autoplay,
      controls: false, // We'll use our custom controls
      responsive: true,
      fluid: true,
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: [
        {
          src: props.source,
          type: "application/x-mpegURL",
        },
      ],
      poster: props.poster,
    });

    playerRef.current = player;

    // Event listeners
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));
    player.on("timeupdate", () => {
      const currentTime = player.currentTime();
      if (currentTime) {
        setCurrentTime(currentTime);
      }
    });
    player.on("loadedmetadata", () => {
      const duration = player.duration();
      if (duration) {
        setDuration(duration);
      }
    });

    player.on("progress", () => {
      const bufferedEnd = player.bufferedEnd?.();
      const duration = player.duration?.();
      if (bufferedEnd && duration) {
        setBuffered((bufferedEnd / duration) * 100);
      }
    });

    player.on("volumechange", () => {
      const volume = player.volume();
      if (volume !== undefined) {
        setVolume(volume);
      }
      const muted = player.muted();
      if (muted !== undefined) {
        setIsMuted(muted);
      }
    });

    // Get available qualities after metadata is loaded
    setTimeout(() => {
      if ((player as any).qualityLevels) {
        const qualities = (player as any).qualityLevels();
        const qualityOptions: {
          height: number;
          bitrate: number;
          enabled: boolean;
        }[] = [];

        for (let i = 0; i < qualities.length; i++) {
          const quality = qualities[i];

          qualityOptions.push({
            height: quality.height,
            bitrate: quality.bitrate,
            enabled: quality.enabled,
          });
        }

        // Sort by height (resolution)
        qualityOptions.sort((a, b) => a.height - b.height);
        setAvailableQualities(qualityOptions);
        setCurrentQuality("Auto");
      }
    }, 300);

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [props.autoplay, props.poster, props.source]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;

    player.muted(!isMuted);
  };
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const seekTo = useCallback(
    (percentage: number) => {
      const player = playerRef.current;
      if (!player) return;

      const video = videoRef.current;
      if (video && duration > 0) {
        const newTime = (percentage / 100) * duration;
        player.currentTime(newTime);

        setCurrentTime(newTime);
      }
    },
    [duration]
  );

  return (
    <div
      ref={containerRef}
      className="relative group w-full bg-black rounded-lg overflow-hidden cursor-pointer"
      style={{ maxWidth: props.width || "1280px" }}
      onClick={togglePlay}
    >
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered w-full h-full"
          playsInline
        />
      </div>
      {/* ============= */}
      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      {!isPlaying && <VideoOverlay />}

      {/* =========== */}

      <div
        className="absolute bottom-0 inset-x-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* timeline */}

        <TimeLine
          currentTime={currentTime}
          duration={duration}
          progress={(currentTime / duration) * 100}
          onSeek={seekTo}
          className="flex items-center gap-x-2 px-2"
          buffered={buffered}
          vttFile={props.thumbnailVttUrl}
        />

        {/* button */}
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-x-2">
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
              onClick={toggleMute}
              className="hover:scale-110 transition-transform"
            >
              {isMuted || volume === 0 ? (
                <Icon.VolumeXIcon className="size-4 md:size-6" />
              ) : (
                <Icon.VolumeIcon className="size-4 md:size-6" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-x-2">
            <Button variant="icon" size="icon">
              <Icon.SettinsIcon className="size-4 md:size-6" />
            </Button>
            <Button
              variant="icon"
              size="icon"
              // onClick={toggleFullscreen}
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
      </div>
    </div>
  );
};

export default VideoPlayer;
