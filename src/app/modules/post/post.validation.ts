import { z } from "zod";

// Accept both regular URLs and base64 data URLs (for image uploads without a CDN)
const imageUrlSchema = z
  .string()
  .refine(
    (val) => {
      if (val.startsWith("data:")) return true; // base64 data URL
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Image must be a valid URL or base64 data URL" }
  )
  .optional();

const createPostZodSchema = z
  .object({
    body: z
      .object({
        text: z
          .string()
          .max(5000, "Post text must be at most 5000 characters")
          .optional(),
        imageUrl: imageUrlSchema.nullable().optional(),
        visibility: z
          .enum(["PUBLIC", "PRIVATE", "public", "private"])
          .default("PUBLIC")
          .transform((value) => value.toUpperCase())
          .optional(),
      })
      .strict(),
  })
  .refine((data) => data.body.text || data.body.imageUrl, {
    message: "Post must have either text or an image",
    path: ["body"],
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
