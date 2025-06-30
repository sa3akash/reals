"use client";

import { Button } from "@/components/ui/button";
import { useReels } from "@/hooks/useReels";
import { cn } from "@/lib/utils";
import {
  Play,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import React from "react";
import { AnimatePresence, motion } from "motion/react";
import ProgressBar from "./ProgressBar";

type VideoPlayerProps = {
  src: string;
  className?: string;
  poster?: string;
  // onTap: (event: React.TouchEvent | React.MouseEvent) => void;
};

const VideoPlayer = (props: VideoPlayerProps) => {
  const { videoRef, isMuted, toggleMute, togglePlay, isPlaying,isLoading,currentTime,duration,progress,seekTo } = useReels();


  



  return (
    <div
      className={cn(
        "md:aspect-9/16 relative h-full snap-start",
        props.className
      )}
        onClick={togglePlay}
      >
      <video
        ref={videoRef}
        poster={props.poster}
        src={props.src}
        className="w-full h-full object-cover md:rounded-md"
        onDoubleClick={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
        preload="metadata"
        loop
      />

      {/* top */}

      <div className="absolute top-0 inset-x-0 flex items-center justify-between z-10">
        <div></div>
        <div onClick={(e)=>e.stopPropagation()}>
          <Button size="icon" onClick={toggleMute} variant="secondary">
            {isMuted ? <VolumeXIcon /> : <Volume2Icon />}
          </Button>
        </div>
      </div>

      {/* Play/Pause Overlay */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center bg-black/10"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-black/60 rounded-full p-6 backdrop-blur-sm border border-white/20"
            >
              <Play className="w-10 h-10 text-white fill-white ml-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Minimal Loading State - Only show when actually loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/30"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                <span className="text-white text-sm font-medium">Loading...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Progress Bar */}
        <div className="absolute bottom-2 left-4 right-4 z-10" onClick={(e)=>e.stopPropagation()}>
          <ProgressBar progress={progress} duration={duration} currentTime={currentTime} onSeek={seekTo} />
        </div>

        

      {/* bottom */}

      {/* action */}
    </div>
  );
};

VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
