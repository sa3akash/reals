import CustomVideoPlayer from '@/components/VideoPlayer'
import React from 'react'

const VideoPlayerPage = () => {
  return (
    <div className='h-screen w-full flex items-center justify-center'>
        <CustomVideoPlayer src='https://t3.storage.dev/sa2uploads/processed/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara/hls/master.m3u8'
        
        poster='https://t3.storage.dev/sa2uploads/processed/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara/thumbnails/02.jpg'
        
        />
    </div>
  )
}

export default VideoPlayerPage