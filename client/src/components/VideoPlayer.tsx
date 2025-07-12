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
import { Check } from "lucide-react";

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
      autoplay: false,
      controls: true, // We'll use our custom controls
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
    player.on("play", () => setIsPlaying(true))
    player.on("pause", () => setIsPlaying(false))
    player.on("timeupdate", () => {
      const currentTime = player.currentTime();
      if (currentTime) {
        setCurrentTime(currentTime);
      }
    })
    player.on("loadedmetadata", () => {
      const duration = player.duration();
      if(duration) {
        setDuration(duration)
      }
    })

      player.on("volumechange", () => {
        const volume = player.volume();
        if (volume !== undefined) {
          setVolume(volume);
        }
        const muted = player.muted();
        if (muted !== undefined) {
          setIsMuted(muted);
        }      
    })

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
    const player = playerRef.current
    if (!player) return

    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
  }

  const toggleMute = () => {
    const player = playerRef.current
    if (!player) return

    player.muted(!isMuted)
  }


  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const player = playerRef.current
    if (!player) return

    const newVolume = Number.parseFloat(e.target.value)
    player.volume(newVolume)

    if (newVolume === 0) {
      player.muted(true)
    } else if (isMuted) {
      player.muted(false)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const player = playerRef.current
    if (!player) return

    const seekTime = Number.parseFloat(e.target.value)
    player.currentTime(seekTime)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
  }

  const changeQuality = (quality: string) => {
    const player = playerRef.current as any;
    if (!player || !player.qualityLevels) return;

    const qualities = player.qualityLevels()

    if (quality === "Auto") {
      // Enable all quality levels for adaptive streaming
      for (let i = 0; i < qualities.length; i++) {
        qualities[i].enabled = true
      }
    } else {
      // Get the height from the quality string (e.g., "720p" -> 720)
      const targetHeight = Number.parseInt(quality.replace("p", ""))

      // Enable only the selected quality
      for (let i = 0; i < qualities.length; i++) {
        qualities[i].enabled = qualities[i].height === targetHeight
      }
    }

    setCurrentQuality(quality)
    setShowSettings(false)
  }

  console.log(availableQualities, currentQuality);


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

      <div className="">
        <select name="" id="" onChange={(e) => changeQuality(e.target.value)} className="bg-white text-black p-2 rounded">
          {
            availableQualities.map((quality) => (
              <option
                key={quality.height}
                value={`${quality.height}`}
                className="text-black"
              >
                {`${quality.height}p`}
                {currentQuality === `${quality.height}` && <Check size={16} />}
              </option>
            ))
          }
        </select>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
