import { createContext, ReactNode, useContext } from "react";
import { useVideoPlayer } from "./useVideoPlayer";
import { VideoPlayerProps } from "./VideoPlayer";


type ContextType = ReturnType<typeof useVideoPlayer>

// Create the context with the correct type
const VideoPlayerContext = createContext<ContextType | null>(null);

type VideoPlayerContextProps = VideoPlayerProps & {
  children: ReactNode;
};

export const VideoPlayerProvider: React.FC<VideoPlayerContextProps> = (props) => {
  const player = useVideoPlayer(props);
  return (
    <VideoPlayerContext.Provider value={player}>
      {props.children}
    </VideoPlayerContext.Provider>
  );
};

export const useVideoPlayerContext = () => {
  const context = useContext(VideoPlayerContext);
  if (!context) throw new Error("useVideoPlayerContext must be used within VideoPlayerProvider");
  return context;
};