/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import videojs from "video.js"
import type Player from "video.js/dist/types/player"

// Helper to format time
export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return "0:00"
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`
}

interface UseVideoPlayerProps {
  src: string
  poster?: string
  videoElement: HTMLVideoElement | null // This prop now correctly receives the ref.current
}

export const useVideoPlayer = ({ src, poster, videoElement }: UseVideoPlayerProps) => {
  const playerRef = useRef<Player | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false) // New state for Picture-in-Picture
  const [playbackRate, setPlaybackRate] = useState(1) // New state for playback speed
  const [isLoading, setIsLoading] = useState(true) // New state for loading
  const [error, setError] = useState<string | null>(null) // New state for errors

  const [availableQualities, setAvailableQualities] = useState<{ height: number; bitrate: number; enabled: boolean }[]>(
    [],
  )
  const [currentQuality, setCurrentQuality] = useState("Auto")
  const [bufferedRanges, setBufferedRanges] = useState<TimeRanges | null>(null) // New state for buffered ranges

  useEffect(() => {
    if (!videoElement) return

    const player = videojs(videoElement, {
      autoplay: false,
      controls: false, // We use our custom controls
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
          type: "application/x-mpegURL", // Assuming HLS source
        },
      ],
      poster,
    })

    playerRef.current = player

    // Event listeners for player state
    player.on("play", () => setIsPlaying(true))
    player.on("pause", () => setIsPlaying(false))
    player.on("timeupdate", () => {
      const currentTime = player.currentTime()
      if (currentTime !== undefined) {
        setCurrentTime(currentTime)
      }
      setBufferedRanges(player.buffered())
    })
    player.on("loadedmetadata", () => {
      const duration = player.duration()
      if (duration !== undefined) {
        setDuration(duration)
      }
      setBufferedRanges(player.buffered())
      setIsLoading(false) // Video metadata loaded, no longer loading
    })
    player.on("volumechange", () => {
      const volume = player.volume()
      if (volume !== undefined) {
        setVolume(volume)
      }
      const muted = player.muted()
      if (muted !== undefined) {
        setIsMuted(muted)
      }
    })
    player.on("ratechange", () => {
      const rate = player.playbackRate()
      if (rate !== undefined) {
        setPlaybackRate(rate)
      }
    })
    player.on("waiting", () => setIsLoading(true)) // Video is buffering
    player.on("playing", () => setIsLoading(false)) // Video resumed playing
    player.on("error", () => {
      setError("Video playback error. Please try again later.")
      setIsLoading(false)
    })

    // Get available qualities after metadata is loaded
    const qualityCheckInterval = setInterval(() => {
      const qualityLevels = (player as any).qualityLevels
      if (qualityLevels) {
        clearInterval(qualityCheckInterval)
        const qualities = qualityLevels()
        const qualityOptions: {
          height: number
          bitrate: number
          enabled: boolean
        }[] = []
        for (let i = 0; i < qualities.length; i++) {
          const quality = qualities[i]
          qualityOptions.push({
            height: quality.height,
            bitrate: quality.bitrate,
            enabled: quality.enabled,
          })
        }
        qualityOptions.sort((a, b) => a.height - b.height)
        setAvailableQualities(qualityOptions)
        setCurrentQuality("Auto")
      }
    }, 100)

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
      clearInterval(qualityCheckInterval)
    }
  }, [poster, src, videoElement])

  // Effect for handling fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    document.addEventListener("mozfullscreenchange", handleFullscreenChange)
    document.addEventListener("MSFullscreenChange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange)
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange)
    }
  }, [])

  // Effect for handling Picture-in-Picture changes
  useEffect(() => {
    const handleEnterPiP = () => setIsPiP(true)
    const handleExitPiP = () => setIsPiP(false)

    // Use the passed videoElement directly
    if (videoElement) {
      videoElement.addEventListener("enterpictureinpicture", handleEnterPiP)
      videoElement.addEventListener("leavepictureinpicture", handleExitPiP)
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener("enterpictureinpicture", handleEnterPiP)
        videoElement.removeEventListener("leavepictureinpicture", handleExitPiP)
      }
    }
  }, [videoElement]) // Depend on videoElement

  const togglePlay = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) {
      player.pause()
    } else {
      player.play()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    player.muted(!isMuted)
  }, [isMuted])

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const player = playerRef.current
      if (!player) return
      const newVolume = Number.parseFloat(e.target.value)
      player.volume(newVolume)
      if (newVolume === 0) {
        player.muted(true)
      } else if (isMuted) {
        player.muted(false)
      }
    },
    [isMuted],
  )

  const handleSeek = useCallback((seekTime: number) => {
    const player = playerRef.current
    if (!player) return
    player.currentTime(seekTime)
  }, [])

  const toggleFullscreen = useCallback(() => {
    const container = videoElement?.parentElement?.parentElement // Assuming containerRef is the parent of the video-js div
    if (!container) return

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if ((container as any).webkitRequestFullscreen) {
        ;(container as any).webkitRequestFullscreen()
      } else if ((container as any).mozRequestFullScreen) {
        ;(container as any).mozRequestFullScreen()
      } else if ((container as any).msRequestFullscreen) {
        ;(container as any).msRequestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        ;(document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        ;(document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        ;(document as any).msExitFullscreen()
      }
    }
  }, [isFullscreen, videoElement])

  const togglePictureInPicture = useCallback(async () => {
    // Use the passed videoElement directly
    if (!videoElement) return

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else if (videoElement.requestPictureInPicture) {
      await videoElement.requestPictureInPicture()
    }
  }, [videoElement]) // Depend on videoElement

  const changePlaybackRate = useCallback((rate: number) => {
    const player = playerRef.current
    if (!player) return
    player.playbackRate(rate)
  }, [])

  const changeQuality = useCallback((quality: string) => {
    const player = playerRef.current as any
    if (!player || !player.qualityLevels) return

    const qualities = player.qualityLevels()
    if (quality === "Auto") {
      for (let i = 0; i < qualities.length; i++) {
        qualities[i].enabled = true
      }
    } else {
      const targetHeight = Number.parseInt(quality.replace("p", ""))
      for (let i = 0; i < qualities.length; i++) {
        qualities[i].enabled = qualities[i].height === targetHeight
      }
    }
    setCurrentQuality(quality)
  }, [])

  return {
    player: playerRef.current,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isPiP,
    playbackRate,
    isLoading,
    error,
    availableQualities,
    currentQuality,
    bufferedRanges,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    handleSeek,
    toggleFullscreen,
    togglePictureInPicture,
    changePlaybackRate,
    changeQuality,
    formatTime,
  }
}
