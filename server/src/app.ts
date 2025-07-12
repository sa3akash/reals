import express from "express";
import cors from "cors";
import "dotenv/config";

import { globalErrorHandler } from "error-express";

import { uploadRoutes } from "./routes/upload.routes";
import { VideoTranscoderService } from "./services/ffmpeg/VideoTranscoderService";
import { S3Downloader } from "./services/ffmpeg/S3Downloader";
import { FFmpegProcessor } from "./services/ffmpeg/FFmpegProcessor";
import { S3Uploader } from "./services/ffmpeg/S3Uploader";
import { S3Mover } from "./services/ffmpeg/S3Mover";
import { DRMProcessor } from "./services/ffmpeg/drm/DRMProcessor";
import { postRoutes } from "./routes/post.routes";
import { mongooseConnection } from "./s3client";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*", // Allow all origins, adjust as necessary for security
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const key =
  "processed/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara/video/original/e6278e54-d17b-4e5e-937e-d98fa744decdfull-video-raanjhan-do-patti-kriti-sanon-shaheer-sheikh-parampara-tandon-sachet-parampara..mp4";

// const encoder = new AdaptiveVideoProcessor();
// encoder.processVideo(key)
const service = new VideoTranscoderService(
  new S3Downloader(),
  new FFmpegProcessor(),
  new S3Uploader(),
  new S3Mover(),
  new DRMProcessor() // Assuming DRMProcessor is correctly implemented
);

service.handleTranscode(key);

app.use("/upload", uploadRoutes.getRoutes());
app.use("/post", postRoutes.getRoutes());

app.use(globalErrorHandler);

app.listen(PORT, async () => {
  await mongooseConnection();
  console.log(`Server is running on http://localhost:${PORT}`);
});
