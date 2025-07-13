import { FFmpegProcessor } from "./FFmpegProcessor";
import { S3Downloader } from "./S3Downloader";
import { S3Uploader } from "./S3Uploader";
import path from "path";
import fs from "fs";
import { S3Mover } from "./S3Mover";
import { generateDRMKeys } from "./drm/KeyGenerator";
import { DRMProcessor } from "./drm/DRMProcessor";

export class VideoTranscoderService {
  constructor(
    private downloader: S3Downloader,
    private processor: FFmpegProcessor,
    private uploader: S3Uploader,
    private mover: S3Mover,
    private drm: DRMProcessor // Assuming FFmpegProcessor handles DRM processing
  ) {}

  public async handleTranscode(s3Key: string) {
    const fileNameWithoutExt = s3Key.split("/").pop()!.split(".")[0];
    const id = fileNameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric, non-space, non-hyphen
      .replace(/\s+/g, "-") // Replace multiple spaces with a single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    const tmpDir = `/tmp/${id}`;

    const inputPath = path.join(tmpDir, "input.mp4");
    const hlsDir = path.join(tmpDir, "hls");
    const dashDir = path.join(tmpDir, "dash");
    const thumbDir = path.join(tmpDir, "thumbnails");
    const subsDir = path.join(tmpDir, "subtitles");
    const drmDir = path.join(tmpDir, "drm");

    const subtitleS3Key = false;

    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true }); // 🧹 delete folder and contents
    }
    fs.mkdirSync(tmpDir, { recursive: true });
    // 1. Download original video
    await this.downloader.download(s3Key, inputPath);

    // 2. Transcode to HLS
    // await this.processor.transcode(inputPath, hlsDir);
    // await this.processor.transcodeToDash(inputPath, dashDir); // error

    // 3. Generate thumbnails
    // await this.processor.generateThumbnails(inputPath, thumbDir);
    // await this.processor.generateTimelinePreview(inputPath, thumbDir);
    // await this.processor.generateTimelinePreviewWithVTT(inputPath, thumbDir);

    await Promise.all([
      this.processor.transcode(inputPath, hlsDir),
      this.processor.generateThumbnails(inputPath, thumbDir),
      this.processor.generateTimelinePreviewWithVTT(inputPath, thumbDir),
    ]);

    if (subtitleS3Key) {
      await this.downloader.download(
        "job.data.subtitleS3Key",
        `${tmpDir}/subtitle.srt`
      );
      await this.processor.convertSubtitles(`${tmpDir}/subtitle.srt`, subsDir);
      await this.uploader.uploadDirectory(subsDir, `processed/${id}/subtitles`);
    }

    // 4.1 Upload DRM keys
    // const drmKey = generateDRMKeys();
    // this.drm.processWithRawKeys(hlsDir + "/master.m3u8", drmDir, [
    //   { label: "default", keyId: drmKey.keyId, key: drmKey.key },
    // ]);

    // await this.uploader.uploadDirectory(drmDir, `processed/${id}/drm`);

    // 4. Upload all folders
    // await this.uploader.uploadDirectory(hlsDir, `processed/${id}/hls`);
    // await this.uploader.uploadDirectory(dashDir, `processed/${id}/dash`);
    // await this.uploader.uploadDirectory(thumbDir, `processed/${id}/thumbnails`);

    // await this.mover.moveOriginal(
    //   s3Key,
    //   `processed/${id}/original/${id}${path.extname(s3Key)}`
    // );

    // 5. Move original to permanent folder
    await Promise.all([
      this.uploader.uploadDirectory(hlsDir, `processed/${id}/hls`),
      this.uploader.uploadDirectory(thumbDir, `processed/${id}/thumbnails`),
      this.mover.moveOriginal(
        s3Key,
        `processed/${id}/original/${id}${path.extname(s3Key)}`
      ),
    ]);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
