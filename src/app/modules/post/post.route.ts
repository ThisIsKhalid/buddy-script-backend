import express from "express";
import { imageUploader } from "../../../helpers/file_uploader/imageUploader";
import auth from "../../middlewares/auth";
import { RequestValidation } from "../../middlewares/validateRequest";
import { PostController } from "./post.controller";
import { PostValidation } from "./post.validation";

const router = express.Router();


router.get(
  "/",
  auth(),
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getFeed
);

router.get(
  "/my-posts",
  auth(),
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getMyPosts
);

router.post(
  "/",
  auth(),
  imageUploader.single("image"),
  RequestValidation.validateRequest(PostValidation.createPostZodSchema),
  PostController.createPost
);

// ---------------------------------------------------------------------------
// Save / Unsave post
// ---------------------------------------------------------------------------
router.post(
  "/:postId/save",
  auth(),

  RequestValidation.validateRequest(PostValidation.postIdParamZodSchema),
  PostController.toggleSavePost
);


router.get(
  "/:postId",

  RequestValidation.validateRequest(PostValidation.postIdParamZodSchema),
  PostController.getPostById
);

router.delete(
  "/:postId",
  auth(),

  RequestValidation.validateRequest(PostValidation.postIdParamZodSchema),
  PostController.deletePost
);

// Likes
router.post("/:postId/like", auth(), PostController.toggleLikePost);
router.get(
  "/:postId/likes",
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getPostLikes
);

// Comments
router.get(
  "/:postId/comments",
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getComments
);
router.post("/:postId/comments", auth(), PostController.createComment);
router.post("/:postId/comments/:commentId/like", auth(), PostController.toggleLikeComment);
router.get(
  "/:postId/comments/:commentId/likes",
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getCommentLikes
);

// Replies
router.get(
  "/:postId/comments/:commentId/replies",
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getReplies
);
router.post("/:postId/comments/:commentId/replies", auth(), PostController.createReply);
router.post("/:postId/comments/:commentId/replies/:replyId/like", auth(), PostController.toggleLikeReply);
router.get(
  "/:postId/comments/:commentId/replies/:replyId/likes",
  RequestValidation.validateRequest(PostValidation.cursorPaginationZodSchema),
  PostController.getReplyLikes
);

export const PostRoutes = router;
