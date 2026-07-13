import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { PostRoutes } from "../modules/post/post.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/posts",
    route: PostRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
  {
    path: "/uploader",
    route: UploadRoutes,
  },
];

moduleRoutes.forEach((r) => router.use(r.path, r.route));

export default router;
