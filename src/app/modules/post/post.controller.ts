/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PostService } from "./post.service";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.createPost(req.user.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Post created successfully.",
    data: result,
  });
});

const getFeed = catchAsync(async (req: Request, res: Response) => {
  const result = await PostService.getFeed(req.query as any);
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

export const PostController = {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  getMyPosts,
  toggleSavePost,
};
