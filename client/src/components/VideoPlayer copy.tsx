/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";

type VideoPlayerProps = {
  src: string;
  poster?: string;
  width?: number;
  height?: number;
};

import React, { useEffect, useRef, useState } from "react";
import Player from "video.js/dist/types/player";
import { Check, CheckCheck, PlayIcon } from "lucide-react";
import { Icon } from "./videoPlayer/_components/icon";
import { set } from "date-fns";
import { Button } from "./ui/button";

const CustomVideoPlayer = ({
  src,
  poster = "",
  width = 1280,
  height = 720,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // state

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
      autoplay: true,
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
          src,
          type: "application/x-mpegURL",
        },
      ],
      poster,
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
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [poster, src]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player) return;

    player.muted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const player = playerRef.current;
    if (!player) return;

    const newVolume = Number.parseFloat(e.target.value);
    player.volume(newVolume);

    if (newVolume === 0) {
      player.muted(true);
    } else if (isMuted) {
      player.muted(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const player = playerRef.current;
    if (!player) return;

    const seekTime = Number.parseFloat(e.target.value);
    player.currentTime(seekTime);
  };

 const toggleFullscreen = () => {
  const container = containerRef.current;
  if (!container) return;

  if (document.fullscreenElement === container) {
    document.exitFullscreen();
  } else {
    container.requestFullscreen();
  }
};

useEffect(() => {
  const handleFullscreenChange = () => {
    const fullscreenEl = document.fullscreenElement;
    setIsFullscreen(fullscreenEl === containerRef.current);
  };

  document.addEventListener("fullscreenchange", handleFullscreenChange);

  return () => {
    document.removeEventListener("fullscreenchange", handleFullscreenChange);
  };
}, []);



  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const changeQuality = (quality: string) => {
    const player = playerRef.current as any;
    if (!player || !player.qualityLevels) return;

    const qualities = player.qualityLevels();

    if (quality === "Auto") {
      // Enable all quality levels for adaptive streaming
      for (let i = 0; i < qualities.length; i++) {
        qualities[i].enabled = true;
      }
    } else {
      // Get the height from the quality string (e.g., "720p" -> 720)
      const targetHeight = Number.parseInt(quality.replace("p", ""));

      // Enable only the selected quality
      for (let i = 0; i < qualities.length; i++) {
        qualities[i].enabled = qualities[i].height === targetHeight;
      }
    }

    setCurrentQuality(quality);
    setShowSettings(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative group w-full bg-black rounded-lg overflow-hidden"
      style={{ maxWidth: width }}
    >
      <div data-vjs-player>
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered w-full h-full"
          playsInline
        />
      </div>

      <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      <div
        className={`absolute bottom-0 left-0 w-full px-4 pb-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      >
        <div className="flex items-center justify-between space-x-4 text-white text-sm">
          <div className="flex items-center space-x-3">
            {/* Play/Pause */}
            <Button variant="icon" size="icon"
              onClick={togglePlay}
              className="hover:scale-110 transition-transform"
            >
              {isPlaying ? <Icon.PauseIcon className="size-6"/> : <Icon.PlayIcon className="size-6"/>}
            </Button>

            {/* Time */}
            <span className="text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

           {/* Center: Seek bar */}
    <input
      type="range"
      min="0"
      max={duration}
      step="0.1"
      value={currentTime}
      onChange={handleSeek}
      className="w-full h-1 accent-red-500 cursor-pointer"
    />

    <div className="flex items-center space-x-3">
  {/* Mute toggle */}
      <Button variant="icon" size="icon" onClick={toggleMute} className="hover:scale-110 transition-transform">
        {isMuted || volume === 0 ? <Icon.VolumeXIcon className="size-6"/> : <Icon.VolumeIcon className="size-6"/>}
      </Button>


      <Button variant="icon" size="icon">
        <Icon.SettinsIcon className="size-6"/>
      </Button>

        {/* Fullscreen toggle */}
      <Button variant="icon" size="icon" onClick={toggleFullscreen} className="hover:scale-110 transition-transform">
        {isFullscreen ? <Icon.FullScreenOffIcon className="size-6"/> : <Icon.FullScreenIcon className="size-6"/>}
      </Button>

    </div>


        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;

{
  /* 
   <div className="hidden">
        <select
          name=""
          id=""
          onChange={(e) => changeQuality(e.target.value)}
          className="bg-gray-800 text-white p-2 rounded"
        >
          <option value="Auto" onClick={() => changeQuality("Auto")}>
            Auto               {currentQuality === `Auto` && <p>c</p>}

          </option>
          {availableQualities.map((quality) => (
            <option
              key={`${quality.height}p`}
              value={`${quality.height}p`}
              // onClick={() => changeQuality(`${quality.height}p`)}
              className="flex items-center gap-x-2"
            >
              {`${quality.height}p`}
              {currentQuality === `${quality.height}p` && <p>c</p>}
            </option>
          ))}
        </select>
      </div>
  
  
  */
}
