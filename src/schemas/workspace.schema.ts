import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name cannot exceed 50 characters"),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(50, "Workspace name cannot exceed 50 characters")
    .optional(),
  logo: z.string().url("Logo must be a valid URL").nullable().optional(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
