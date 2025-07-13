/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import videojs from "./videojs";
import Player from "video.js/dist/types/player";
import { VideoPlayerProps } from "./VideoPlayer";

interface QualityLevel {
  height: number;
  bitrate: number;
  enabled: boolean;
}

export const useVideoPlayer = (props: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<Player | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [availableQualities, setAvailableQualities] = useState<QualityLevel[]>(
    []
  );
  const [currentQuality, setCurrentQuality] = useState("Auto");

  // Chapters state for UI highlight
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number | null>(
    null
  );

const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);


  // Initialize Video.js player
  useEffect(() => {
    if (!isClient || !videoRef.current || playerRef.current) return;

    const player = videojs(videoRef.current, {
      autoplay: props.autoplay,
      controls: false,
      responsive: true,
      fluid: true,
      muted: props.muted,
      preload: props.preload || "auto",
      html5: {
        hls: {
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          overrideNative: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
      sources: props.source,
      poster: props.poster,
    });

    // Add subtitles if any
    if (props.subtitles?.length) {
      props.subtitles.forEach(({ kind, src, srclang, label, default: def }) => {
        player.addRemoteTextTrack(
          {
            kind,
            src,
            srclang,
            label,
            default: def,
          },
          false
        );
      });
    }

    playerRef.current = player;

    // Events
    player.on("play", () => setIsPlaying(true));
    player.on("pause", () => setIsPlaying(false));

    player.on("timeupdate", () => {
      const time = player.currentTime();

      if (!time) return;

      setCurrentTime(time);

      // Update current chapter index
      if (props.chapters && props.chapters?.length) {
        const idx = props.chapters.findIndex(
          (ch, i) =>
            time >= ch.time &&
            (i === props.chapters!.length - 1 ||
              time < props.chapters![i + 1].time)
        );
        setCurrentChapterIndex(idx !== -1 ? idx : null);
      }
    });

    player.on("loadedmetadata", () => {
      setDuration(player.duration() || 0);
    });

    player.on("progress", () => {
      const bufferedEnd = player.bufferedEnd?.();
      const dur = player.duration();
      if (bufferedEnd && dur) setBuffered((bufferedEnd / dur) * 100);
    });
    player.on("volumechange", () => {
      const volume = player.volume();
      const mute = player.muted();

      if (volume) setVolume(volume);
      if (mute) setIsMuted(mute);
    });

    player.ready(() => {
      setIsMuted(player.muted() ?? false);

      player.on("loadedmetadata", () => {
        const qualityLevels = (player as any).qualityLevels?.();
        if (!qualityLevels) return;

        const qualityOptions: QualityLevel[] = [];
        for (let i = 0; i < qualityLevels.length; i++) {
          const level = qualityLevels[i];
          qualityOptions.push({
            height: level.height,
            bitrate: level.bitrate,
            enabled: level.enabled,
          });
        }
        qualityOptions.sort((a, b) => a.height - b.height);
        setAvailableQualities(qualityOptions);
        setCurrentQuality("Auto");
      });
    });

    // Cleanup
    return () => {
      player.dispose();
      playerRef.current = null;
    };
  }, [props.source, props.poster, props.autoplay, props.muted, props.preload, props.subtitles, props.chapters, isClient]);

  // Controls handlers
  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (player.paused()) player.play();
    else player.pause();
  }, []);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const currentlyMuted = player.muted();
    player.muted(!currentlyMuted);
    setIsMuted(!currentlyMuted); // manually sync with UI
  }, []);

  const seekTo = useCallback(
    (percentage: number) => {
      const player = playerRef.current;
      if (!player) return;
      const newTime = (percentage / 100) * duration;
      player.currentTime(newTime);
    },
    [duration]
  );

  const seekToSeconds = useCallback(
    (seconds: number) => {
      const player = playerRef.current;
      if (!player) return;
      const newTime = Math.min(currentTime + seconds, duration)
      player.currentTime(newTime);
    },
    [currentTime, duration]
  );

  const setQuality = useCallback((height: number | "Auto") => {
    const player = playerRef.current;
    if (!player || !(player as any).qualityLevels) return;

    const qualityLevels = (player as any)?.qualityLevels();

    if (height === "Auto") {
      for (let i = 0; i < qualityLevels.length; i++) {
        qualityLevels[i].enabled = true;
      }
      setCurrentQuality("Auto");
    } else {
      for (let i = 0; i < qualityLevels.length; i++) {
        qualityLevels[i].enabled = qualityLevels[i].height === height;
      }
      setCurrentQuality(height.toString());
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement === containerRef.current?.parentElement
      );
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // Advanced keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const player = playerRef.current;
      if (!player) return;

      switch (e.key) {
        case " ":
        case "k": // play/pause
          e.preventDefault();
          togglePlay()
          break;
        case "m": // mute toggle
          e.preventDefault();
          toggleMute()
          break;
        case "f": // fullscreen toggle
          e.preventDefault();
          toggleFullscreen()
          break;
        case "ArrowRight": // seek forward 5s
          e.preventDefault();
          player.currentTime(
            Math.min((player.currentTime() || 0) + 5, player.duration() || 0)
          );
          break;
        case "ArrowLeft": // seek backward 5s
          e.preventDefault();
          player.currentTime(Math.max((player.currentTime() || 0) - 5, 0));
          break;
        case "ArrowUp": // volume up
          e.preventDefault();
          player.volume(Math.min((player.volume() || 0) + 0.1, 1));
          break;
        case "ArrowDown": // volume down
          e.preventDefault();
          player.volume(Math.max((player.volume() || 0) - 0.1, 0));
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleFullscreen, toggleMute, togglePlay]);

  // Jump to chapter
  const jumpToChapter = useCallback((time: number) => {
    const player = playerRef.current;
    if (!player) return;
    player.currentTime(time);
  }, []);

  const formatTime = (time?: number) => {
    if (typeof time !== "number" || time < 0) {
      return "00:00"; // or handle invalid input differently
    }
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      // Format with hours
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      // Format without hours
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
  };

    const handleChangeVolume = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      setVolume(newVolume);
      playerRef.current?.volume?.(newVolume);
      if (newVolume > 0 && isMuted) toggleMute(); // auto-unmute if volume > 0
    },[isMuted, toggleMute]);

  return {
    videoRef,
    containerRef,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seekTo,
    volume,
    isMuted,
    toggleMute,
    isFullscreen,
    toggleFullscreen,
    buffered,
    availableQualities,
    currentQuality,
    setQuality,
    chapters: props.chapters ?? [],
    currentChapterIndex,
    jumpToChapter,
    vttFileUrl: props.vttUrl,
    progress: (currentTime / duration) * 100,
    formatTime,
    handleChangeVolume,
    seekToSeconds
  };
};
