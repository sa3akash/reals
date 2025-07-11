import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";

class UploadRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public getRoutes() {
    this.router.post(
      "/generate-presign-url",
      UploadController.generatePresignedUrl
    );
    this.router.post(
      "/initiate-multipart-upload",
      UploadController.initiateMultipartUpload
    );
    this.router.post(
      "/generate-presign-chunk-url",
      UploadController.generatePresignChunkUrl
    );
    this.router.post(
      "/complete-multipart-upload",
      UploadController.completeMultipartUpload
    );
    this.router.post("/delete-file", UploadController.deleteFile);
    return this.router;
  }
}

export const uploadRoutes: UploadRoutes = new UploadRoutes();
