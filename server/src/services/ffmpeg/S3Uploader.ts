import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { S3 } from "../../s3client";

export class S3Uploader {
  private bucket = process.env.AWS_BUCKET_NAME!;

  async uploadDirectory(localDir: string, s3Prefix: string): Promise<void> {
    const files = this.walk(localDir);

    await Promise.all(
      files.map(async (filePath) => {
        const relativePath = path.relative(localDir, filePath);
        const s3Key = `${s3Prefix}/${relativePath}`.replace(/\\/g, "/");

        await S3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: s3Key,
            Body: fs.createReadStream(filePath),
            ContentType: this.getContentType(filePath),
          })
        );
      })
    );
  }

  private walk(dir: string): string[] {
    return fs.readdirSync(dir).flatMap((file) => {
      const full = path.join(dir, file);
      return fs.statSync(full).isDirectory() ? this.walk(full) : [full];
    });
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath);
    const map: Record<string, string> = {
      ".m3u8": "application/x-mpegURL",
      ".ts": "video/MP2T",
      ".mp4": "video/mp4",
    };
    return map[ext] || "application/octet-stream";
  }
}
