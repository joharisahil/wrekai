import { z } from "zod";

export const signUpSchema = z
  .object({
    email: z.email("Enter a valid work email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or less."),
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(80, "Name must be 80 characters or less."),
  })
  .strict();

export const signInSchema = z
  .object({
    email: z.email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72, "Password must be 72 characters or less."),
  })
  .strict();

export const magicLinkSchema = z
  .object({
    email: z.email("Enter a valid email address."),
  })
  .strict();

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
