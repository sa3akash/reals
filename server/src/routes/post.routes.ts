import { Router } from "express";
import { PostController } from "../controllers/post.controller";

class PostRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
  }

  public getRoutes() {
    this.router.post(
      "/create-post",
      PostController.createPost
    );
    this.router.get(
      "/post/:id",
      PostController.getPost
    );
    
    return this.router;
  }
}

export const postRoutes: PostRoutes = new PostRoutes();
