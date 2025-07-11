import { Request, Response } from "express";

import crypto from "crypto";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "../s3client";

export class UploadController {
  public static async generatePresignedUrl(req: Request, res: Response) {
    const { fileName, fileType, size } = req.body;

    const key = `${crypto.randomUUID() + fileName}`; // Generate a unique key for the file

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });

    // Handle file upload logic here
    // For example, you can use multer or any other library to handle file uploads
    res.status(200).json({
      presignedUrl,
      key,
      message: "Presigned URL generated successfully",
    });
  }

  public static async initiateMultipartUpload(req: Request, res: Response) {
    const { fileName } = req.body;

    const key = `${crypto.randomUUID() + fileName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    const response = await S3.send(command);

    res.status(200).json({
      uploadId: response.UploadId,
      key,
      message: "Multipart upload initiated successfully",
    });
  }

  public static async generatePresignChunkUrl(req: Request, res: Response) {
    const { chunkNumber, uploadId, key } = req.body;

    if (!uploadId || !key || !chunkNumber) {
      return res.status(400).json({ message: "Missing or invalid inputs." });
    }

    const command = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: chunkNumber,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 3600, // URL valid for 1 hour
    });

    res.status(200).json({
      presignedUrl,
      key,
      message: "Presigned URL generated successfully",
    });
  }

  public static async completeMultipartUpload(req: Request, res: Response) {
    const { uploadId, key, parts } = req.body;

    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return res.status(400).json({ message: "Missing or invalid inputs." });
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    const response = await S3.send(command);

    res.status(200).json({
      key: response.Key,
      message: "Multipart upload completed successfully",
    });
  }

  public static async deleteFile(req: Request, res: Response) {
    const { key } = req.body;
    if (!key || typeof key !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid object key." });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
    });

    await S3.send(command);

    // For example, you can use multer or any other library to handle file uploads
    res.status(200).json({
      message: "File deleted successfully",
    });
  }
}
