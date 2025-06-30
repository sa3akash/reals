"use client";

import React from "react";
import VideoPlayer from "./common/VideoPlayer";
import { reelsData } from "@/lib/data";
import { Button } from "../ui/button";
import { useSnapScroll } from "@/hooks/useSnapScroll";
import { ChevronDown, ChevronUp } from "lucide-react";

const ReelsPlayer = () => {
  const { ref, scrollTo, hasNext, hasPrev } = useSnapScroll<HTMLDivElement>();

  return (
    <div className="h-screen flex items-center justify-center">
      <div
        className="h-full scroll-touch snap-y snap-mandatory overflow-y-scroll no-scrollbar"
        ref={ref}
      >
        {reelsData.map((item) => (
          <VideoPlayer key={item.id} src={item.videoUrl} />
        ))}
      </div>
      <div className="hidden md:flex absolute top-1/2 right-4 -translate-y-1/2 flex-col gap-4 ">
        {hasPrev && (
          <Button
            onClick={() => scrollTo("up")}
            size="iconLg"
            variant="secondary"
          >
            <ChevronUp />
          </Button>
        )}
        {hasNext && (
          <Button
            onClick={() => scrollTo("down")}
            size="iconLg"
            variant="secondary"
          >
            <ChevronDown />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReelsPlayer;
