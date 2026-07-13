import httpStatus from "http-status";
import ApiError from "../../../errors/apiError";
import prisma from "../../../lib/prisma";
import { ICreatePostInput, ICursorPaginationQuery } from "./post.interface";

const toClientVisibility = (visibility: string) => visibility.toLowerCase();

const createPost = async (userId: string, data: ICreatePostInput) => {
  const visibility = (data.visibility ?? "PUBLIC").toUpperCase() as "PUBLIC" | "PRIVATE";

  const post = await prisma.post.create({
    data: {
      authorId: userId,
      text: data.text || null,
      imageUrl: data.imageUrl || null,
      visibility,
    },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  return {
    id: post.id,
    authorId: post.authorId,
    author: {
      id: post.author.id,
      firstName: post.author.firstName,
      lastName: post.author.lastName,
      avatarUrl: post.author.avatarUrl,
    },
    text: post.text,
    imageUrl: post.imageUrl,
    visibility: toClientVisibility(post.visibility),
    likeCount: 0,
    commentCount: 0,
    isLikedByMe: false,
    createdAt: post.createdAt.toISOString(),
  };
};

const getFeed = async (query: ICursorPaginationQuery, currentUserId?: string) => {
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
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      _count: { select: { comments: true } },
    },
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;

  const postIds = items.map((p) => p.id);
  const likes = await prisma.like.findMany({
    where: {
      targetType: "POST",
      targetId: { in: postIds },
    },
    select: { targetId: true, userId: true },
  });

  const mappedItems = items.map((post) => {
    const postLikes = likes.filter((l) => l.targetId === post.id);
    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        email: post.author.email,
        avatarUrl: post.author.avatarUrl
      },
      text: post.text,
      imageUrl: post.imageUrl,
      visibility: toClientVisibility(post.visibility),
      likeCount: postLikes.length,
      commentCount: post._count.comments,
      isLikedByMe: currentUserId ? postLikes.some((l) => l.userId === currentUserId) : false,
      createdAt: post.createdAt.toISOString(),
    };
  });

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return { items: mappedItems, nextCursor };
};


const getPostById = async (postId: string, currentUserId?: string) => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      _count: { select: { comments: true } },
    },
  });

  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found.");
  }

  // Private posts are only visible to the owner
  if (post.visibility === "PRIVATE" && post.authorId !== currentUserId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You do not have access to this post.");
  }

  const postLikes = await prisma.like.findMany({
    where: { targetType: "POST", targetId: post.id },
    select: { userId: true },
  });

  return {
    id: post.id,
    authorId: post.authorId,
    author: {
      id: post.author.id,
      firstName: post.author.firstName,
      lastName: post.author.lastName,
      email: post.author.email,
      avatarUrl: post.author.avatarUrl
    },
    text: post.text,
    imageUrl: post.imageUrl,
    visibility: toClientVisibility(post.visibility),
    likeCount: postLikes.length,
    commentCount: post._count.comments,
    isLikedByMe: currentUserId ? postLikes.some((l) => l.userId === currentUserId) : false,
    createdAt: post.createdAt.toISOString(),
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
      author: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      _count: { select: { comments: true } },
    },
  });

  const hasNextPage = posts.length > limit;
  const items = hasNextPage ? posts.slice(0, limit) : posts;

  const postIds = items.map((p) => p.id);
  const likes = await prisma.like.findMany({
    where: {
      targetType: "POST",
      targetId: { in: postIds },
    },
    select: { targetId: true, userId: true },
  });

  const mappedItems = items.map((post) => {
    const postLikes = likes.filter((l) => l.targetId === post.id);
    return {
      id: post.id,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        email: post.author.email,
        avatarUrl: post.author.avatarUrl,
      },
      text: post.text,
      imageUrl: post.imageUrl,
      visibility: toClientVisibility(post.visibility),
      likeCount: postLikes.length,
      commentCount: post._count.comments,
      isLikedByMe: postLikes.some((l) => l.userId === userId),
      createdAt: post.createdAt.toISOString(),
    };
  });

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;

  return { items: mappedItems, nextCursor };
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


const toggleLikePost = async (postId: string, userId: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found.");
  }

  const existingLike = await prisma.like.findFirst({
    where: { targetType: "POST", targetId: postId, userId },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    const count = await prisma.like.count({
      where: { targetType: "POST", targetId: postId },
    });
    return { isLiked: false, likeCount: count };
  }

  await prisma.like.create({
    data: { targetType: "POST", targetId: postId, userId },
  });
  const count = await prisma.like.count({
    where: { targetType: "POST", targetId: postId },
  });
  return { isLiked: true, likeCount: count };
};


const getPostLikes = async (postId: string, query: ICursorPaginationQuery) => {
  const limit = query.limit ?? 10;
  const where: Record<string, any> = { targetType: "POST", targetId: postId };

  if (query.cursor) {
    const cursorLike = await prisma.like.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorLike) {
      where.createdAt = { lt: cursorLike.createdAt };
    }
  }

  const likes = await prisma.like.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, avatarUrl: true },
      },
    },
  });

  const hasNextPage = likes.length > limit;
  const items = hasNextPage ? likes.slice(0, limit) : likes;

  const mappedLikers = items.map((like) => ({
    id: like.user.id,
    firstName: like.user.firstName,
    lastName: like.user.lastName,
    email: like.user.email,
    avatarUrl: like.user.avatarUrl,
    createdAt: like.user.createdAt.toISOString(),
  }));

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;
  return { likers: mappedLikers, nextCursor };
};


const createComment = async (userId: string, postId: string, text: string) => {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new ApiError(httpStatus.NOT_FOUND, "Post not found.");
  }

  const comment = await prisma.comment.create({
    data: { postId, authorId: userId, text },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
  });

  return {
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    author: {
      id: comment.author.id,
      firstName: comment.author.firstName,
      lastName: comment.author.lastName,
      email: comment.author.email,
      avatarUrl: comment.author.avatarUrl,
    },
    text: comment.text,
    likeCount: 0,
    replyCount: 0,
    isLikedByMe: false,
    createdAt: comment.createdAt.toISOString(),
  };
};


const getComments = async (postId: string, query: ICursorPaginationQuery, currentUserId?: string) => {
  const limit = query.limit ?? 10;
  const where: Record<string, any> = { postId };

  if (query.cursor) {
    const cursorComment = await prisma.comment.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorComment) {
      where.createdAt = { gt: cursorComment.createdAt }; // chronological asc
    }
  }

  const comments = await prisma.comment.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
      _count: { select: { replyComments: true } },
    },
  });

  const hasNextPage = comments.length > limit;
  const items = hasNextPage ? comments.slice(0, limit) : comments;

  const commentIds = items.map((c) => c.id);
  const likes = await prisma.like.findMany({
    where: {
      targetType: "COMMENT",
      targetId: { in: commentIds },
    },
    select: { targetId: true, userId: true },
  });

  const mappedComments = items.map((c) => {
    const commentLikes = likes.filter((l) => l.targetId === c.id);
    return {
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      author: {
        id: c.author.id,
        firstName: c.author.firstName,
        lastName: c.author.lastName,
        email: c.author.email,
        avatarUrl: c.author.avatarUrl,
      },
      text: c.text,
      likeCount: commentLikes.length,
      replyCount: c._count.replyComments,
      isLikedByMe: currentUserId ? commentLikes.some((l) => l.userId === currentUserId) : false,
      createdAt: c.createdAt.toISOString(),
    };
  });

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;
  return { comments: mappedComments, nextCursor };
};


const toggleLikeComment = async (commentId: string, userId: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found.");
  }

  const existingLike = await prisma.like.findFirst({
    where: { targetType: "COMMENT", targetId: commentId, userId },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    const count = await prisma.like.count({
      where: { targetType: "COMMENT", targetId: commentId },
    });
    return { isLiked: false, likeCount: count };
  }

  await prisma.like.create({
    data: { targetType: "COMMENT", targetId: commentId, userId },
  });
  const count = await prisma.like.count({
    where: { targetType: "COMMENT", targetId: commentId },
  });
  return { isLiked: true, likeCount: count };
};


const getCommentLikes = async (commentId: string, query: ICursorPaginationQuery) => {
  const limit = query.limit ?? 10;
  const where: Record<string, any> = { targetType: "COMMENT", targetId: commentId };

  if (query.cursor) {
    const cursorLike = await prisma.like.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorLike) {
      where.createdAt = { lt: cursorLike.createdAt };
    }
  }

  const likes = await prisma.like.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, avatarUrl: true },
      },
    },
  });

  const hasNextPage = likes.length > limit;
  const items = hasNextPage ? likes.slice(0, limit) : likes;

  const mappedLikers = items.map((like) => ({
    id: like.user.id,
    firstName: like.user.firstName,
    lastName: like.user.lastName,
    email: like.user.email,
    avatarUrl: like.user.avatarUrl,
    createdAt: like.user.createdAt.toISOString(),
  }));

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;
  return { likers: mappedLikers, nextCursor };
};


const createReply = async (userId: string, commentId: string, text: string) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Comment not found.");
  }

  const reply = await prisma.replyComment.create({
    data: { commentId, authorId: userId, text },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
  });

  return {
    id: reply.id,
    commentId: reply.commentId,
    authorId: reply.authorId,
    author: {
      id: reply.author.id,
      firstName: reply.author.firstName,
      lastName: reply.author.lastName,
      email: reply.author.email,
      avatarUrl: reply.author.avatarUrl,
    },
    text: reply.text,
    likeCount: 0,
    isLikedByMe: false,
    createdAt: reply.createdAt.toISOString(),
  };
};


const getReplies = async (commentId: string, query: ICursorPaginationQuery, currentUserId?: string) => {
  const limit = query.limit ?? 10;
  const where: Record<string, any> = { commentId };

  if (query.cursor) {
    const cursorReply = await prisma.replyComment.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorReply) {
      where.createdAt = { gt: cursorReply.createdAt }; // chronological
    }
  }

  const replies = await prisma.replyComment.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
      },
    },
  });

  const hasNextPage = replies.length > limit;
  const items = hasNextPage ? replies.slice(0, limit) : replies;

  const replyIds = items.map((r) => r.id);
  const likes = await prisma.like.findMany({
    where: {
      targetType: "REPLY_COMMENT",
      targetId: { in: replyIds },
    },
    select: { targetId: true, userId: true },
  });

  const mappedReplies = items.map((r) => {
    const replyLikes = likes.filter((l) => l.targetId === r.id);
    return {
      id: r.id,
      commentId: r.commentId,
      authorId: r.authorId,
      author: {
        id: r.author.id,
        firstName: r.author.firstName,
        lastName: r.author.lastName,
        email: r.author.email,
        avatarUrl: r.author.avatarUrl,
      },
      text: r.text,
      likeCount: replyLikes.length,
      isLikedByMe: currentUserId ? replyLikes.some((l) => l.userId === currentUserId) : false,
      createdAt: r.createdAt.toISOString(),
    };
  });

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;
  return { replies: mappedReplies, nextCursor };
};


const toggleLikeReply = async (replyId: string, userId: string) => {
  const reply = await prisma.replyComment.findUnique({ where: { id: replyId } });
  if (!reply) {
    throw new ApiError(httpStatus.NOT_FOUND, "Reply not found.");
  }

  const existingLike = await prisma.like.findFirst({
    where: { targetType: "REPLY_COMMENT", targetId: replyId, userId },
  });

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } });
    const count = await prisma.like.count({
      where: { targetType: "REPLY_COMMENT", targetId: replyId },
    });
    return { isLiked: false, likeCount: count };
  }

  await prisma.like.create({
    data: { targetType: "REPLY_COMMENT", targetId: replyId, userId },
  });
  const count = await prisma.like.count({
    where: { targetType: "REPLY_COMMENT", targetId: replyId },
  });
  return { isLiked: true, likeCount: count };
};


const getReplyLikes = async (replyId: string, query: ICursorPaginationQuery) => {
  const limit = query.limit ?? 10;
  const where: Record<string, any> = { targetType: "REPLY_COMMENT", targetId: replyId };

  if (query.cursor) {
    const cursorLike = await prisma.like.findUnique({
      where: { id: query.cursor },
      select: { createdAt: true },
    });
    if (cursorLike) {
      where.createdAt = { lt: cursorLike.createdAt };
    }
  }

  const likes = await prisma.like.findMany({
    where,
    take: limit + 1,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, avatarUrl: true },
      },
    },
  });

  const hasNextPage = likes.length > limit;
  const items = hasNextPage ? likes.slice(0, limit) : likes;

  const mappedLikers = items.map((like) => ({
    id: like.user.id,
    firstName: like.user.firstName,
    lastName: like.user.lastName,
    email: like.user.email,
    avatarUrl: like.user.avatarUrl,
    createdAt: like.user.createdAt.toISOString(),
  }));

  const nextCursor = hasNextPage ? items[items.length - 1].id : null;
  return { likers: mappedLikers, nextCursor };
};


export const PostService = {
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
