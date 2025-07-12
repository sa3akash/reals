import { ServerError } from "error-express";
import { Request, Response } from "express";
import { VideoModel } from "../models/Video.model";

export class PostController {
  public static async createPost(req: Request, res: Response) {
    const { title, description, s3Key } = req.body;

    if (!title || !description || !s3Key) {
      throw new ServerError("Title, description, and s3Key are required.", 400);
    }

    const post = await VideoModel.create({
      title,
      description,
      originalFile: {
        s3Key,
        size: 0,
        duration: 0,
        resolution: "1920x1080",
      },
    });

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });
  }

  static async getPost(req: Request, res: Response) {
    const { id } = req.params;

    if (!id) {
      throw new ServerError("Post ID is required.", 400);
    }

    const post = await VideoModel.findById(id);

    if (!post) {
      throw new ServerError("Post not found.", 404);
    }

    return res.status(200).json({
      message: "Post retrieved successfully",
      post,
    });
  }
}
