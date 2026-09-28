import { z } from "zod";
import { WorkspaceRole } from "@prisma/client";

export const createInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .toLowerCase(),
  role: z
    .enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER] as const, {
      message: "Role must be either ADMIN or MEMBER",
    })
    .default(WorkspaceRole.MEMBER),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
