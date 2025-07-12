import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { S3 } from "../..//s3client";

export class S3Mover {
  private bucket = process.env.AWS_BUCKET_NAME!;

  async moveOriginal(fromKey: string, toKey: string): Promise<void> {
    await S3.send(new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `/${this.bucket}/${fromKey}`,
      Key: toKey,
    }));

    await S3.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: fromKey,
    }));

    console.log(`Moved original: ${fromKey} → ${toKey}`);
  }
}
