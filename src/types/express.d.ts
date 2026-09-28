import { WorkspaceRole } from "@prisma/client";

export interface JwtUserPayload {
  userId: string;
  email: string;
}

export interface WorkspaceMemberPayload {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtUserPayload;
      workspaceMember?: WorkspaceMemberPayload;
    }
  }
}

