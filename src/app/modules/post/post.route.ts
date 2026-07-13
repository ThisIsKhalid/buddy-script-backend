import express from "express";
import {
  postCreatePolicy,
  postDeletePolicy,
  postFeedPolicy,
  postGetPolicy,
  postSavePolicy,
} from "../../../config/rateLimitPolicies";
import auth from "../../middlewares/auth";
import { rateLimiter } from "../../middlewares/rateLimiter";
import { RequestValidation } from "../../middlewares/validateRequest";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";

const router = express.Router();


router.get(
  "/",
  auth(),
  rateLimiter(postFeedPolicy),
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getFeed
);

router.get(
  "/my-posts",
  auth(),
  rateLimiter(postFeedPolicy),
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getMyPosts
);

router.post(
  "/",
  auth(),
  rateLimiter(postCreatePolicy),
  RequestValidation.validateRequest(PostValidation.createPostZodSchema),
  PostController.createPost
);

// ---------------------------------------------------------------------------
// Save / Unsave post
// ---------------------------------------------------------------------------
router.post(
  "/:postId/save",
  auth(),
  rateLimiter(postSavePolicy),
  RequestValidation.validateRequest(PostValidation.postIdParamZodSchema),
  PostController.toggleSavePost
);


router.get(
  "/:postId",
  auth(),
  rateLimiter(postGetPolicy),
  RequestValidation.validateRequest(PostValidation.postIdParamZodSchema),
  PostController.getPostById
);

router.delete(
  "/:postId",
  auth(),
  rateLimiter(postDeletePolicy),
  RequestValidation.validateRequest(PostValidation.postIdParamZodSchema),
  PostController.deletePost
);

export const PostRoutes = router;
