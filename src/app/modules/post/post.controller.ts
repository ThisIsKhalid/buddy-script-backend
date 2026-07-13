/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { getPublicImageUrl } from "../../../helpers/file_uploader/publicImageUrl";
import { PostService } from "./post.service";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const imageUrl = req.file ? getPublicImageUrl(req.file.filename) : req.body.imageUrl;
  const result = await PostService.createPost(req.user.id, {
    ...req.body,
    imageUrl,
  });
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Post created successfully.",
    data: result,
  });
});

const getFeed = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getFeed(req.query as any, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Feed retrieved successfully.",
    data: result.items,
    meta: { nextCursor: result.nextCursor },
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const result = await PostService.getPostById(postId, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Post retrieved successfully.",
    data: result,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  await PostService.deletePost(postId, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Post deleted successfully.",
    data: null,
  });
});

const getMyPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getMyPosts(req.user.id, req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your posts retrieved successfully.",
    data: result.items,
    meta: { nextCursor: result.nextCursor },
  });
});

const toggleSavePost = catchAsync(async (req: Request, res: Response) => {
  const postId = req.params.postId as string;
  const result = await PostService.toggleSavePost(postId, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.saved ? "Post saved successfully." : "Post unsaved successfully.",
    data: result,
  });
});

const toggleLikePost = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.toggleLikePost(req.params.postId as string, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Post like toggled successfully.",
    data: result,
  });
});

const getPostLikes = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getPostLikes(req.params.postId as string, req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Post likers retrieved successfully.",
    data: result.likers,
    meta: { nextCursor: result.nextCursor },
  });
});

const createComment = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.createComment(req.user.id, req.params.postId as string, req.body.text);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Comment created successfully.",
    data: result,
  });
});

const getComments = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getComments(req.params.postId as string, req.query as any, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comments retrieved successfully.",
    data: result.comments,
    meta: { nextCursor: result.nextCursor },
  });
});

const toggleLikeComment = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.toggleLikeComment(req.params.commentId as string, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comment like toggled successfully.",
    data: result,
  });
});

const getCommentLikes = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getCommentLikes(req.params.commentId as string, req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Comment likers retrieved successfully.",
    data: result.likers,
    meta: { nextCursor: result.nextCursor },
  });
});

const createReply = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.createReply(req.user.id, req.params.commentId as string, req.body.text);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Reply created successfully.",
    data: result,
  });
});

const getReplies = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getReplies(req.params.commentId as string, req.query as any, req.user?.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Replies retrieved successfully.",
    data: result.replies,
    meta: { nextCursor: result.nextCursor },
  });
});

const toggleLikeReply = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.toggleLikeReply(req.params.replyId as string, req.user.id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reply like toggled successfully.",
    data: result,
  });
});

const getReplyLikes = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getReplyLikes(req.params.replyId as string, req.query as any);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Reply likers retrieved successfully.",
    data: result.likers,
    meta: { nextCursor: result.nextCursor },
  });
});

export const PostController = {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  getMyPosts,
  toggleSavePost,
  toggleLikePost,
  getPostLikes,
  createComment,
  getComments,
  toggleLikeComment,
  getCommentLikes,
  createReply,
  getReplies,
  toggleLikeReply,
  getReplyLikes,
};
