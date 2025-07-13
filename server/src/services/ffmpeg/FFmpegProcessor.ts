import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { path as ffprobePath } from "@ffprobe-installer/ffprobe";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

interface ResolutionProfile {
  name: string;
  width: number;
  height: number;
  bitrate: string;
}

export class FFmpegProcessor {
  private RESOLUTIONS: ResolutionProfile[] = [
    { name: "240p", width: 426, height: 240, bitrate: "500k" },
    { name: "360p", width: 640, height: 360, bitrate: "800k" },
    { name: "480p", width: 854, height: 480, bitrate: "1200k" },
    { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
    { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
    { name: "2K", width: 2560, height: 1440, bitrate: "15000k" },
    { name: "4K", width: 3840, height: 2160, bitrate: "40000k" },
  ];

  public async transcode(inputPath: string, outputDir: string): Promise<void> {
    fs.mkdirSync(outputDir, { recursive: true });

    return new Promise<void>(async (resolve, reject) => {
      const { width, framerate } = await this.getVideoMetadata(inputPath);
      const applicableResolutions = this.getApplicableResolutions(width);
      const segmentTime = 6; // or 4 if you decide to shorten
      const gopSize = Math.round(framerate * segmentTime);

      const command = ffmpeg(inputPath)
        .addOption("-preset", "fast")
        .addOption("-g", gopSize.toString())
        .addOption("-keyint_min", gopSize.toString())
        .addOption("-sc_threshold", "0")
        .addOption("-force_key_frames", "expr:gte(t,n_forced*6)")
        .addOption("-hls_flags", "independent_segments")
        .addOption("-hls_segment_type", "mpegts");

      let filter = "";
      const outputOptions: string[] = [];

      applicableResolutions.forEach((res, i) => {
        filter += `[0:v]scale=w=${res.width}:h=${res.height}[v${i}];`;
        outputOptions.push(
          "-map",
          `[v${i}]`,
          "-map",
          "0:a?", // Optional audio
          `-c:v:${i}`,
          "libx264",
          `-b:v:${i}`,
          res.bitrate,
          "-maxrate",
          `${parseInt(res.bitrate) * 1.5}k`,
          "-bufsize",
          `${parseInt(res.bitrate) * 2}k`,
          `-profile:v:${i}`,
          "main", // helps with compatibility
          `-x264opts`,
          `keyint=48:min-keyint=48:no-scenecut`
        );
      });

      command
        .complexFilter(filter.slice(0, -1))
        .outputOptions([
          ...outputOptions,
          "-c:a",
          "aac",
          "-ac",
          "2", // stereo audio
          "-b:a",
          "128k",
          "-f",
          "hls",
          "-hls_time",
          "6",
          "-hls_playlist_type",
          "vod",
          "-hls_segment_type",
          "mpegts",
          "-hls_list_size",
          "0",
          "-hls_segment_filename",
          `${outputDir}/%v/segment_%03d.ts`,
          "-var_stream_map",
          applicableResolutions
            .map(
              (_, i) => `v:${i},a:${i},name:${applicableResolutions[i].name}`
            )
            .join(" "),
          "-master_pl_name",
          "master.m3u8",
        ])
        .output(`${outputDir}/%v/playlist.m3u8`)
        .on("start", (commandLine) =>
          console.log("FFmpeg started with:", commandLine)
        )
        .on("progress", (progress) => {
          console.log(`Processing: ${Math.round(progress.percent || 0)}% done`);
        })
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });
  }

  private getApplicableResolutions(sourceWidth: number): ResolutionProfile[] {
    return this.RESOLUTIONS.filter((res) => sourceWidth >= res.width);
  }

  private async getVideoMetadata(inputPath: string): Promise<{
    width: number;
    height: number;
    duration: number;
    framerate: number;
  }> {
    try {
      const metadata = await new Promise<ffmpeg.FfprobeData>(
        (resolve, reject) => {
          ffmpeg()
            .input(inputPath)
            .ffprobe((err, data) => {
              if (err) return reject(err);
              resolve(data);
            });
        }
      );

      const videoStream = metadata.streams.find(
        (s) => s.codec_type === "video"
      );

      if (!videoStream || !videoStream.width || !videoStream.height) {
        throw new Error("Could not determine video dimensions");
      }

      const width = videoStream.width;
      const height = videoStream.height;

      const duration = parseFloat(
        `${videoStream.duration}` || `${metadata.format.duration}` || "0"
      );

      const rFrameRate = videoStream.r_frame_rate || "30/1";
      const framerateParts = rFrameRate.split("/");
      const framerate =
        framerateParts.length === 2
          ? parseFloat(framerateParts[0]) / parseFloat(framerateParts[1])
          : parseFloat(rFrameRate);

      return { width, height, duration, framerate };
    } catch (error) {
      console.error("Error getting video metadata:", error);
      throw error;
    }
  }

  public async generateThumbnails(
    inputPath: string,
    outputDir: string
  ): Promise<void> {
    fs.mkdirSync(outputDir, { recursive: true });

    // Get video duration
    const { duration } = await this.getVideoMetadata(inputPath);

    const times = [0.2, 0.4, 0.6, 0.8].map((p) =>
      Math.floor(Number(duration) * p)
    );

    await Promise.all(
      times.map((time, i) => {
        return new Promise((resolve, reject) => {
          ffmpeg(inputPath)
            .screenshots({
              timestamps: [time],
              filename: `${String(i + 1).padStart(2, "0")}.jpg`,
              folder: outputDir,
              size: "1280x720",
            })
            .on("end", resolve)
            .on("error", reject);
        });
      })
    );
  }

  public async convertSubtitles(srtPath: string, outDir: string) {
    fs.mkdirSync(outDir, { recursive: true });
    const vtt = path.join(outDir, path.basename(srtPath, ".srt") + ".vtt");
    await new Promise((res, rej) =>
      ffmpeg(srtPath).output(vtt).on("end", res).on("error", rej).run()
    );
  }

  public async generateTimelinePreviewWithVTT(
    inputPath: string,
    outputDir: string
  ): Promise<void> {
    fs.mkdirSync(outputDir, { recursive: true });

    const { duration } = await this.getVideoMetadata(inputPath);

    const { columns, intervalSeconds, thumbHeight, thumbWidth } =
      this.getTimelinePreviewConfig(duration);

    const thumbsCount = Math.floor(Number(duration) / intervalSeconds);

    const rows = Math.ceil(thumbsCount / columns);
    const spritePath = path.join(outputDir, "preview-strip.jpg");
    const vttPath = path.join(outputDir, "thumbs.vtt");
    const tempThumbsDir = path.join(outputDir, "temp");

    fs.mkdirSync(tempThumbsDir, { recursive: true });

    // Step 1: Extract thumbnails every X seconds
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-vf",
          `fps=1/${intervalSeconds},scale=${thumbWidth}:${thumbHeight}`,
          "-q:v",
          "3",
        ])
        .output(path.join(tempThumbsDir, "thumb-%03d.jpg"))
        .on("end", () => resolve())
        .on("error", reject)
        .run();
    });

    // Step 2: Build sprite from thumbnails
    await new Promise<void>((resolve, reject) => {
      ffmpeg(path.join(tempThumbsDir, "thumb-%03d.jpg").replace(/\\/g, "/"))
        .inputOptions(["-pattern_type", "sequence"])
        .outputOptions([
          `-vf`,
          `tile=${columns}x${rows}`,
          "-frames:v",
          "1",
          "-q:v",
          "3",
        ])
        .format("mjpeg") // ✅ KEY FIX
        .output(spritePath.replace(/\\/g, "/"))
        .on("end", () => resolve())
        .on("error", reject)
        .run();
        // .on("stderr", (line) => console.error("FFmpeg sprite stderr:", line))
    });

    // Step 3: Generate thumbs.vtt
    let vttContent = "WEBVTT\n\n";
    for (let i = 0; i < thumbsCount; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const x = col * thumbWidth;
      const y = row * thumbHeight;

      const start = await this.formatVttTimestamp(i * intervalSeconds);
      const end = await this.formatVttTimestamp((i + 1) * intervalSeconds);

      vttContent += `${start} --> ${end}\n`;
      vttContent += `preview-strip.jpg#xywh=${x},${y},${thumbWidth},${thumbHeight}\n\n`;
    }

    fs.writeFileSync(vttPath, vttContent);

    // Step 4: Clean up temp thumbnails
    fs.rmSync(tempThumbsDir, { recursive: true, force: true });
  }

  private getTimelinePreviewConfig(duration: number) {
    const thumbWidth = 160;

    // 16:9 thumbnail size (adjust width for quality)
    const thumbHeight = Math.round((thumbWidth * 9) / 16);

    // Interval logic
    const intervalSeconds = duration < 900 ? 5 : duration < 1800 ? 10 : 15;

    // Column logic (number of thumbs per row in the sprite sheet)
    const columns = duration < 900 ? 5 : duration < 1800 ? 8 : 10;

    return { intervalSeconds, thumbWidth, thumbHeight, columns };
  }

  private async formatVttTimestamp(seconds: number) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds - Math.floor(seconds)) * 1000);

    return `${this.pad(hrs)}:${this.pad(mins)}:${this.pad(secs)}.${this.pad(
      ms,
      3
    )}`;
  }

  private pad(num: number, size = 2): string {
    return num.toString().padStart(size, "0");
  }

  async transcodeToDash(inputPath: string, outputDir: string): Promise<void> {
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    fs.mkdirSync(outputDir, { recursive: true });

    const { width, framerate } = await this.getVideoMetadata(inputPath);

    console.log({ width, framerate, inputPath });

    const applicableResolutions = this.getApplicableResolutions(width);
    const segmentTime = 6;
    const gopSize = Math.round(framerate * segmentTime);

    let filterComplex = "";
    const outputOptions: string[] = [];
    const hasAudio = true; // set to false if you're unsure and want to test

    applicableResolutions.forEach((res, i) => {
      const stream = `v${i}`;
      filterComplex += `[0:v]scale=w=${res.width}:h=${res.height}[${stream}];`;
      outputOptions.push(
        "-map",
        `[${stream}]`,
        `-c:v:${i}`,
        "libx264",
        `-b:v:${i}`,
        `${res.bitrate}k`,
        "-maxrate",
        `${Math.round(parseInt(res.bitrate) * 1.5)}k`,
        "-bufsize",
        `${Math.round(parseInt(res.bitrate) * 2)}k`,
        "-profile:v",
        "main"
      );
    });

    if (hasAudio) {
      outputOptions.push(
        "-map",
        "0:a?",
        "-c:a",
        "aac",
        "-ac",
        "2",
        "-b:a",
        "128k",
        "-ar",
        "48000"
      );
    }

    return new Promise<void>((resolve, reject) => {
      const ffmpegCommand = ffmpeg(inputPath)
        .addOption("-y")
        .addOption("-preset", "fast")
        .addOption("-g", gopSize.toString())
        .addOption("-keyint_min", gopSize.toString())
        .addOption("-sc_threshold", "0")
        .addOption("-force_key_frames", `expr:gte(t,n_forced*${segmentTime})`)
        .complexFilter(filterComplex.slice(0, -1)) // remove last `;`
        .outputOptions(outputOptions)
        .output(path.join(outputDir, "manifest.mpd"))
        .addOption("-f", "dash")
        .addOption("-seg_duration", segmentTime.toString())
        .addOption("-use_timeline", "1")
        .addOption("-use_template", "1")
        .addOption("-init_seg_name", "init-stream$RepresentationID$.m4s")
        .addOption(
          "-media_seg_name",
          "chunk-stream$RepresentationID$-$Number%05d$.m4s"
        )
        .addOption(
          "-adaptation_sets",
          hasAudio ? "id=0,streams=v id=1,streams=a" : "id=0,streams=v"
        )
        .on("start", (cmd) => console.log("FFmpeg command:", cmd))
        .on("stderr", (line) => console.log("FFmpeg log:", line))
        .on("progress", (p) => {
          if (p.percent) console.log(`Progress: ${Math.round(p.percent)}%`);
        })
        .on("end", () => {
          console.log("Transcoding complete!");
          resolve();
        })
        .on("error", (err) => {
          console.error("FFmpeg error:", err.message);
          reject(new Error(`FFmpeg error: ${err.message}`));
        });

      ffmpegCommand.run();
    });
  }
}

// ====================

/*
    await new Promise<void>((resolve, reject) => {
      ffmpeg(path.join(tempThumbsDir, "thumb-%03d.jpg"))
        .inputOptions(["-pattern_type", "sequence"])
        .outputOptions([`-vf`, `tile=${columns}x${rows}`, "-q:v", "3"])
        .output(spritePath)
        .on("end", () => resolve())
        .on("stderr", line => console.error("FFmpeg sprite stderr:", line))
        .on("error", reject)
        .run();
    });


    public async generateTimelinePreviewWithVTT(
    inputPath: string,
    outputDir: string,
    intervalSeconds = 10,
    thumbWidth = 160,
    thumbHeight = 90,
    columns = 5
  ): Promise<void> {
    fs.mkdirSync(outputDir, { recursive: true });

    const { duration } = await this.getVideoMetadata(inputPath);
    const thumbsCount = Math.floor(Number(duration) / intervalSeconds);
    const rows = Math.ceil(thumbsCount / columns);
    const spritePath = path.join(outputDir, "preview-strip.jpg");
    const vttPath = path.join(outputDir, "thumbs.vtt");
    const tempThumbsDir = path.join(outputDir, "temp");

    fs.mkdirSync(tempThumbsDir, { recursive: true });

    // Step 1: Extract thumbnails every X seconds
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-vf",
          `fps=1/${intervalSeconds},scale=${thumbWidth}:${thumbHeight}`,
          "-q:v",
          "3",
        ])
        .output(path.join(tempThumbsDir, "thumb-%03d.jpg"))
        .on("end",()=>resolve())
        .on("error", reject)
        .run();
    });

    // Step 2: Build sprite from thumbnails
    await new Promise<void>((resolve, reject) => {
      ffmpeg(path.join(tempThumbsDir, "thumb-%03d.jpg"))
        .inputOptions(["-pattern_type", "sequence"])
        .outputOptions([`-vf`, `tile=${columns}x${rows}`, "-q:v", "3"])
        .output(spritePath)
        .on("end",()=>resolve())
        .on("error", reject)
        .run();
    });

    // Step 3: Generate thumbs.vtt
    let vttContent = "WEBVTT\n\n";
    for (let i = 0; i < thumbsCount; i++) {
      const row = Math.floor(i / columns);
      const col = i % columns;
      const x = col * thumbWidth;
      const y = row * thumbHeight;

      const start = this.formatVttTimestamp(i * intervalSeconds);
      const end = this.formatVttTimestamp((i + 1) * intervalSeconds);

      vttContent += `${start} --> ${end}\n`;
      vttContent += `preview-strip.jpg#xywh=${x},${y},${thumbWidth},${thumbHeight}\n\n`;
    }
    fs.writeFileSync(vttPath, vttContent);

    // Step 4: Clean up temp thumbnails
    fs.rmSync(tempThumbsDir, { recursive: true, force: true });
  }



*/
