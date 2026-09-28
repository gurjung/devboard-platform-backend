import { z } from "zod";
import { WorkspaceRole } from "@prisma/client";

export const updateMemberRoleSchema = z.object({
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER] as const, {
    message: "Role must be either ADMIN or MEMBER",
  }),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
