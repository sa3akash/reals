import { GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { S3 } from "../../s3client";
import { Readable } from "stream";

export class S3Downloader {
  private bucket = process.env.AWS_BUCKET_NAME!;

  public async download(s3Key: string, localPath: string): Promise<void> {
    const result = await S3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
    }));

    const stream = result.Body as Readable;
    const writeStream = fs.createWriteStream(localPath);

    await new Promise<void>((res, rej) =>
      stream.pipe(writeStream).on("finish", res).on("error", rej)
    );
  }
}
