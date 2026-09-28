import { Request, Response, NextFunction } from "express";
import { WorkspaceRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";

const roleHierarchy: Record<WorkspaceRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export const requireWorkspaceRole = (
  minRole: WorkspaceRole,
  paramName = "workspaceId"
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params[paramName] as string;
      const userId = req.user?.userId;

      if (!workspaceId) {
        return next(new AppError("Workspace ID is required", 400));
      }

      if (!userId) {
        return next(new AppError("Authentication required", 401));
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId,
          },
        },
      });

      if (!member) {
        return next(new AppError("Workspace not found or access denied", 404));
      }

      if (roleHierarchy[member.role] < roleHierarchy[minRole]) {
        return next(new AppError("Insufficient workspace permissions", 403));
      }

      req.workspaceMember = {
        id: member.id,
        workspaceId: member.workspaceId,
        userId: member.userId,
        role: member.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
