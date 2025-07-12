// models/Video.ts
import mongoose, { Schema } from "mongoose";

const VideoSchema = new Schema(
  {
    title: String,
    description: String,
    
    originalFile: {
      s3Key: String,
      size: Number,
      duration: Number,
      resolution: String,
    },

    hls: {
      masterPlaylist: String, // e.g. s3://bucket/processed/{id}/hls/master.m3u8
      variants: [
        {
          name: String, // 360p, 720p, etc
          resolution: String, // 640x360
          bitrate: String,
          playlist: String, // e.g. s3Key to 360p/playlist.m3u8
        },
      ],
    },

    preview: {
      image: String, // preview-strip.jpg path
      vtt: String, // thumbs.vtt path
      width: Number,
      height: Number,
      interval: Number, // seconds
    },

    subtitles: [
      {
        lang: String, // en, fr, etc
        label: String,
        s3Key: String,
      },
    ],

    drm: {
      clearKey: {
        keyId: String,
        key: String,
      },
      widevine: {
        pssh: String,
        licenseUrl: String,
      },
    },

    visibility: {
      type: String,
      enum: ["public", "private", "processing"],
      default: "processing",
    },
    // createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const VideoModel = mongoose.model("Video", VideoSchema);
