import { z } from "zod";

const createPostZodSchema = z.object({
  body: z
    .object({
      text: z
        .string()
        .min(1, "Post text is required")
        .max(5000, "Post text must be at most 5000 characters"),
      imageUrl: z.string().url("Image URL must be a valid URL").optional(),
      visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC").optional(),
    })
    .strict(),
});

const cursorPaginationZodSchema = z.object({
  query: z
    .object({
      cursor: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
    })
    .strict(),
});

const postIdParamZodSchema = z.object({
  params: z
    .object({
      postId: z.string().min(1, "Post ID is required"),
    })
    .strict(),
});

export const PostValidation = {
  createPostZodSchema,
  cursorPaginationZodSchema,
  postIdParamZodSchema,
};
