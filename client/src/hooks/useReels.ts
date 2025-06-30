import { useCallback, useEffect, useRef, useState } from "react";

export interface ReelData {
  id: number;
  videoUrl: string;
  thumbnail: string;
  user: {
    username: string;
    avatar: string;
    verified: boolean;
  };
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  music: string;
  duration: number;
}

export const useReels = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // timeline ---
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Auto-play management
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlayback = async () => {
      if (isPlaying) {
        try {
          await video.play();
        } catch (error) {
          console.log("❌ Autoplay prevented:", error);
          setIsPlaying(false);
        }
      } else {
        video.pause();
      }
    };

    // Small delay for smooth experience
    const timer = setTimeout(handlePlayback, 100);
    return () => clearTimeout(timer);
  }, [isPlaying]);

  // Mute management
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleWaiting = () => {
      // console.log("⏳ Video buffering...");
      setIsLoading(true);
    };

    const handlePlaying = () => {
      // console.log("▶️ Video is now playing");
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      // console.log("✅ Video can play");
      setIsLoading(false);
      if (isPlaying && video.paused) {
        video.play().catch((error) => {
          console.log("Autoplay failed:", error);
          setIsPlaying(false);
        });
      }
    };

    const handlePlay = () => {
      // console.log("✅ Video play");
      setIsPlaying(true);
    };

    const handlePause = () => {
      //  console.log("❌ Video paused");
      setIsPlaying(false);
    };

    const updateProgress = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      setCurrentTime(currentTime);
      setDuration(duration);
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    };

    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("timeupdate", updateProgress);

    return () => {
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("timeupdate", updateProgress);
    };
  }, [isPlaying]);

  const seekTo = useCallback(
    (percentage: number) => {
      const video = videoRef.current;
      if (video && duration > 0) {
        const newTime = (percentage / 100) * duration;
        video.currentTime = newTime;
        setCurrentTime(newTime);
        setProgress(percentage);
      }
    },
    [duration]
  );

  // intersection observer

  useEffect(() => {
    const video = videoRef.current;

    const observer = new IntersectionObserver(
      ([entity]) => {
        // entity.forEach((item) => {
        //   setIsPlaying(item.isIntersecting);
        // });
        setIsPlaying(entity.isIntersecting);
      },
      { threshold: 0.9 }
    );

    if (video) {
      observer.observe(video);
    }

    return () => {
      if (video) {
        observer.unobserve(video);
      }
      observer.disconnect();
    };
  }, []);

  return {
    videoRef,
    toggleMute,
    togglePlay,
    isMuted,
    isPlaying,
    isLoading,
    progress,
    duration,
    currentTime,
    seekTo,
  };
};
