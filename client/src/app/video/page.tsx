import React from "react";

import VideoPlayer from "@/components/videoPlayer/VideoPlayer";

const VideoPlayerPage = () => {
  const src =
    "https://t3.storage.dev/sa2uploads/processed/vscode-cline-continue-never-pay-for-cursor-again/hls/master.m3u8";
  // const src =
  //   "https://t3.storage.dev/sa2uploads/processed/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara/hls/master.m3u8";

  const poster =
    "https://t3.storage.dev/sa2uploads/processed/vscode-cline-continue-never-pay-for-cursor-again/thumbnails/01.jpg";
  // const poster =
  //   "https://t3.storage.dev/sa2uploads/processed/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara/thumbnails/02.jpg";
  const vttFile =
    "https://t3.storage.dev/sa2uploads/processed/vscode-cline-continue-never-pay-for-cursor-again/thumbnails/thumbs.vtt";
  // const vttFile =
  //   "https://t3.storage.dev/sa2uploads/processed/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara/thumbnails/thumbs.vtt";

  const subtitles = [
    {
      kind: "subtitles" as const,
      src: "data:text/vtt;base64,V0VCVlRUCgowMDowMDowMC4wMDAgLS0+IDAwOjAwOjA1LjAwMAoqKldlbGNvbWUgdG8gdGhlIEFkdmFuY2VkIFZpZGVvIFBsYXllcioqCgowMDowMDowNS4wMDAgLS0+IDAwOjAwOjEwLjAwMAoqKlRoaXMgaXMgYSBkZW1vIHN1YnRpdGxlKio=",
      srclang: "en",
      label: "English",
      default: true,
    },
    {
      kind: "subtitles" as const,
      src: "data:text/vtt;base64,V0VCVlRUCgowMDowMDowMC4wMDAgLS0+IDAwOjAwOjA1LjAwMAoqKkJpZW52ZW51ZSBhdSBsZWN0ZXVyIHZpZMOpbyBhdmFuY8OpKio=",
      srclang: "fr",
      label: "Français",
      default: false,
    },
    {
      kind: "captions" as const,
      src: "data:text/vtt;base64,V0VCVlRUCgowMDowMDowMC4wMDAgLS0+IDAwOjAwOjA1LjAwMAoqKkJpZW52ZW5pZG8gYWwgcmVwcm9kdWN0b3IgZGUgdsOtZGVvIGF2YW56YWRvKio=",
      srclang: "es",
      label: "Español",
      default: false,
    },
    {
      kind: "captions" as const,
      src: "data:text/vtt;base64,V0VCVlRUCgowMDowMDowMC4wMDAgLS0+IDAwOjAwOjA1LjAwMAoqKkJlbXZpbmRvIGFvIHJlcHJvZHV0b3IgZGUgdsOtZGVvIGF2YW7Dp2Fkbyoq",
      srclang: "pt",
      label: "Português",
      default: false,
    },
  ];

  const chapters = [
    {
      time: 0,
      title: "Opening Credits",
      description: "Introduction and title sequence",
    },
    {
      time: 30,
      title: "Character Introduction",
      description: "Meet the main characters and setting",
    },
    {
      time: 90,
      title: "Plot Setup",
      description: "Story background and initial conflict",
    },
    {
      time: 180,
      title: "Rising Action",
      description: "Tension builds and complications arise",
    },
    {
      time: 300,
      title: "Climax",
      description: "Peak of the story and main conflict",
    },
    {
      time: 420,
      title: "Resolution",
      description: "Conflict resolution and story conclusion",
    },
    {
      time: 540,
      title: "End Credits",
      description: "Final credits and additional scenes",
    },
  ];

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <VideoPlayer
        poster={poster}
        source={[{ src: src, type: "application/x-mpegURL" }]}
        subtitles={subtitles}
        vttUrl={vttFile}
        chapters={chapters}
        autoplay={false}
        muted={false}
        preload="metadata"
      />
    </div>
  );
};

export default VideoPlayerPage;
