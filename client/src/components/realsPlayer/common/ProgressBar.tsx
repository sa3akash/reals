import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";

interface ProgressBarProps {
  progress: number;
  duration: number;
  currentTime: number;
  onSeek?: (percentage: number) => void;
  className?: string;
}

const ProgressBar = (props: ProgressBarProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    setHoverProgress(Math.max(0, Math.min(100, percentage)));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !props.onSeek) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    props.onSeek(Math.max(0, Math.min(100, percentage)));
  };

  const getHoverTime = () => {
    return (hoverProgress / 100) * props.duration;
  };

  return (
    <div className={cn("flex items-center gap-3", props.className)}>
      <span className="text-white text-xs font-medium min-w-[35px] drop-shadow-lg">
        {formatTime(props.currentTime)}
      </span>

      <div
        ref={progressRef}
        className="flex-1 relative group cursor-pointer"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* Background track */}
        <div className="h-1 bg-white/30 rounded-full overflow-hidden">
          {/* Progress fill */}
          <div
            className="h-full bg-white rounded-full transition-all duration-100 ease-linear relative"
            style={{ width: `${props.progress}%` }}
          >
            {/* Progress thumb */}
            <div
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-opacity ${
                isHovering ? "opacity-100" : "opacity-0"
              }`}
            />
          </div>

          {/* Hover preview */}
          {isHovering && (
            <div
              className="absolute top-0 h-full bg-white/50 transition-all duration-75"
              style={{
                left: `${Math.min(props.progress, hoverProgress)}%`,
                width: `${Math.abs(hoverProgress - props.progress)}%`,
              }}
            />
          )}
        </div>

        {/* Hover time tooltip */}
        {isHovering && (
          <div
            className="absolute -top-8 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
            style={{ left: `${hoverProgress}%` }}
          >
            {formatTime(getHoverTime())}
          </div>
        )}
      </div>

      <span className="text-white text-xs font-medium min-w-[35px] drop-shadow-lg">
        {formatTime(props.duration)}
      </span>
    </div>
  );
};

export default ProgressBar;
