import { z } from "zod";

/** Absolute Windows or POSIX path; the Rust side canonicalizes before use. */
export const pathSchema = z
  .string()
  .min(1, "Path is required")
  .refine(
    (value) => value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value),
    "Path must be absolute",
  );

export const jobIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Invalid job id");

export const commandErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  recoverable: z.boolean(),
});

export type CommandErrorPayload = z.infer<typeof commandErrorSchema>;
