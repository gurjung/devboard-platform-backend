import { WorkspaceRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { WorkspaceMemberPayload } from "../types/express";

export const getWorkspaceMembers = async (workspaceId: string) => {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    role: member.role,
    createdAt: member.createdAt,
    user: member.user,
  }));
};

export const updateMemberRole = async (
  workspaceId: string,
  memberId: string,
  currentMember: WorkspaceMemberPayload,
  newRole: WorkspaceRole
) => {
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.workspaceId !== workspaceId) {
    throw new AppError("Member not found in this workspace", 404);
  }

  if (targetMember.role === "OWNER") {
    throw new AppError("Cannot change the role of the workspace owner", 403);
  }

  if (currentMember.role === "ADMIN" && targetMember.role === "ADMIN") {
    throw new AppError("Admins cannot change the role of other admins", 403);
  }

  const updatedMember = await prisma.workspaceMember.update({
    where: { id: memberId },
    data: { role: newRole },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return {
    id: updatedMember.id,
    userId: updatedMember.userId,
    role: updatedMember.role,
    createdAt: updatedMember.createdAt,
    user: updatedMember.user,
  };
};

export const removeMember = async (
  workspaceId: string,
  memberId: string,
  currentMember: WorkspaceMemberPayload
) => {
  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: memberId },
  });

  if (!targetMember || targetMember.workspaceId !== workspaceId) {
    throw new AppError("Member not found in this workspace", 404);
  }

  if (targetMember.role === "OWNER") {
    throw new AppError("Workspace owner cannot be removed", 403);
  }

  const isSelf = targetMember.userId === currentMember.userId;

  if (!isSelf) {
    if (currentMember.role === "MEMBER") {
      throw new AppError("Insufficient permissions to remove members", 403);
    }

    if (currentMember.role === "ADMIN" && targetMember.role === "ADMIN") {
      throw new AppError("Admins cannot remove other admins", 403);
    }
  }

  await prisma.workspaceMember.delete({
    where: { id: memberId },
  });
};
