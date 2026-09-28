import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(50, "Project name cannot exceed 50 characters"),
  logo: z.string().url("Logo must be a valid URL").nullable().optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Project name must be at least 2 characters")
    .max(50, "Project name cannot exceed 50 characters")
    .optional(),
  logo: z.string().url("Logo must be a valid URL").nullable().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
