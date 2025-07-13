import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState } from "react";
import { SpriteThumbnail, parseVttSpriteFile } from "./thumbnail-parser";
import { useVideoPlayerContext } from "../VideoPlayerContext";

const TimeLine = ({ className, ...props }: React.ComponentProps<"div">) => {
  const { vttFileUrl, seekTo, duration, buffered, progress,formatTime } =
    useVideoPlayerContext();

  const [isHovering, setIsHovering] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  const [thumbnails, setThumbnails] = useState<SpriteThumbnail[]>([]);

  const getThumbnailSprite = () => {
    const seconds = getHoverTime();
    return thumbnails?.find((t) => seconds >= t.start && seconds < t.end);
  };

  useEffect(() => {
    if (vttFileUrl) {
      parseVttSpriteFile(vttFileUrl).then(setThumbnails);
    }
  }, [vttFileUrl]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;

    // Clamp to [0, 100]
    setHoverProgress(Math.max(0, Math.min(100, percent)));
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !seekTo) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    seekTo(Math.max(0, Math.min(100, percentage)));
  };

  const getHoverTime = () => {
    return (hoverProgress / 100) * duration;
  };

  return (
    <div className={cn("text-white text-sm px-2", className)} {...props}>
      {/* <span className="text-white text-xs font-medium min-w-[35px]">
        {formatTime(currentTime)}
      </span> */}

      <div
        ref={progressRef}
        className="flex-1 relative group/progress cursor-pointer h-3 "
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* 🔵 Buffered bar */}
        <div className="absolute top-1/2 -translate-y-1/2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-white/30 transition-all duration-200 ease-linear"
            style={{ width: `${buffered ?? 0}%` }}
          />
        </div>

        {/* 🔴 Played progress bar */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-20 transition-all duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        >
          {/* ⚪ Progress Thumb */}
          <div
            className={`absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 transition-opacity duration-150 ${
              isHovering ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>

        {/* 🟡 Hover bar */}
        {isHovering && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-1 bg-white/50 rounded-full z-30"
            style={{
              left: `${Math.min(progress, hoverProgress)}%`,
              width: `${Math.abs(hoverProgress - progress)}%`,
            }}
          />
        )}

        {/* 🖼️ Hover Thumbnail */}
        {isHovering && vttFileUrl && (
          <div className="hidden md:block absolute top-0 left-0 w-full h-full pointer-events-none z-50">
            {(() => {
              const thumb = getThumbnailSprite();
              if (!thumb || !progressRef.current) return null;

              const containerWidth = progressRef.current.offsetWidth;
              const hoverX = (hoverProgress / 100) * containerWidth;

              const thumbnailWidth = thumb.w;
              const thumbnailHeight = thumb.h;

              const left = Math.min(
                Math.max(hoverX - thumbnailWidth / 2, 0),
                containerWidth - thumbnailWidth
              );

              return (
                <div
                  className="absolute"
                  style={{
                    left: `${left}px`,
                    top: `-115px`,
                    width: `${thumbnailWidth}px`,
                    height: `${thumbnailHeight}px`,
                  }}
                >
                  <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover rounded-md shadow-lg border border-white/10"
                    style={{
                      backgroundImage: `url(${thumb.imageUrl})`,
                      backgroundPosition: `-${thumb.x}px -${thumb.y}px`,
                      backgroundSize: `auto`,
                    }}
                  >
                    <div className="absolute bottom-1 right-1 px-1 text-[10px] bg-black/70 text-white rounded">
                      {formatTime(getHoverTime())}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* {isHovering && (
          <div
            className={cn(
              "absolute -top-8 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none"
            )}
            style={{ left: `${Math.max(1, Math.min(hoverProgress, 99))}%` }}
          >
            {formatTime(getHoverTime())}
          </div>
        )} */}
      </div>

      {/* <span className="text-white text-xs font-medium min-w-[35px]">
        {formatTime(duration)}
      </span> */}
    </div>
  );
};

export default TimeLine;

{
  /*
{isHovering && (
  <div
    className="absolute -top-24 transform -translate-x-1/2 flex flex-col items-center pointer-events-none"
    style={{ left: `${hoverProgress}%` }}
  >
     {(() => {
      const thumb = getThumbnailSprite();
      if (!thumb) return null;

      return (
        <div
          className="w-[160px] h-[90px] bg-black rounded shadow-lg mb-1"
          style={{
            backgroundImage: `url(${thumb.imageUrl})`,
            backgroundPosition: `-${thumb.x}px -${thumb.y}px`,
            backgroundSize: `auto`,
            width: `${thumb.w}px`,
            height: `${thumb.h}px`,
          }}
        />
      );
    })()}

 
     <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
      {formatTime(getHoverTime())}
    </div> }
  </div>

  */
}
