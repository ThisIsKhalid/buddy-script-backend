import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Normalise an email: trim whitespace and lowercase. */
const normalisedEmail = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email address")
  .trim()
  .toLowerCase();

// ---------------------------------------------------------------------------
// Schemas — every body schema uses `.strict()` to reject unknown fields.
// ---------------------------------------------------------------------------

const createUserZodSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: normalisedEmail,
      password: z.string().min(6, "Password must be at least 6 characters long"),
    })
    .strict(),
});

const loginZodSchema = z.object({
  body: z
    .object({
      email: normalisedEmail,
      password: z.string().min(1, "Password is required"),
    })
    .strict(),
});

const refreshTokenZodSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(1, "Refresh token is required"),
    })
    .strict(),
});

export const AuthValidation = {
  createUserZodSchema,
  loginZodSchema,
  refreshTokenZodSchema,
 
};
