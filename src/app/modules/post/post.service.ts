import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import { ICreatePostInput, ICursorPaginationQuery } from "./post.interface";


const createPost = async (userId: string, data: ICreatePostInput) => {
  const post = await prisma.post.create({
    data: {
      authorId: userId,
      text: data.text,
      imageUrl: data.imageUrl,
      visibility: data.visibility ?? "PUBLIC",
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
  return post;
};

const getFeed = async (query: ICursorPaginationQuery) => {
  const limit = query.limit ?? 10;

  const where: Record<string, unknown> = { visibility: "PUBLIC" };

  if (query.cursor) {
    const cursorPost = await prisma.post.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorPost) {
      where.createdAt = { lt: cursorPost.createdAt };
    }
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: { select: { comments: true, savedPosts: true } },
    },
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return { items, nextCursor };
};


const getPostById = async (postId: string, userId?: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: { select: { comments: true, savedPosts: true } },
      savedPosts: userId ? { where: { userId }, select: { id: true }, take: 1 } : false,
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found.");
  }

  // Private posts are only visible to the owner
  if (post.visibility === "PRIVATE" && post.authorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this post.");
  }

  return {
    ...post,
    isSaved: Array.isArray(post.savedPosts) && post.savedPosts.length > 0,
    savedPosts: undefined,
  };
};


const deletePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found.");
  }

  if (post.authorId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You can only delete your own posts.");
  }

  await prisma.post.delete({ where: { id: postId } });
};

const getMyPosts = async (userId: string, query: ICursorPaginationQuery) => {
  const limit = query.limit ?? 10;

  const where: Record<string, unknown> = { authorId: userId };

  if (query.cursor) {
    const cursorPost = await prisma.post.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorPost) {
      where.createdAt = { lt: cursorPost.createdAt };
    }
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { comments: true, savedPosts: true } },
    },
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;
  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return { items, nextCursor };
};


const toggleSavePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found.");
  }

  const existingSave = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  if (existingSave) {
    await prisma.savedPost.delete({
      where: { userId_postId: { userId, postId } },
    });
    return { saved: false };
  }

  await prisma.savedPost.create({
    data: { userId, postId },
  });
  return { saved: true };
};

export const PostService = {
  createPost,
  getFeed,
  getPostById,
  deletePost,
  getMyPosts,
  toggleSavePost,
};
