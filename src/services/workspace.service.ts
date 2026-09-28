import crypto from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { generateSlug } from "../utils/slugify";
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "../schemas/workspace.schema";

export const createWorkspace = async (
  userId: string,
  input: CreateWorkspaceInput
) => {
  let slug = generateSlug(input.name);
  if (!slug) {
    slug = "workspace";
  }

  const existingSlug = await prisma.workspace.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
  }

  const workspace = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: {
        name: input.name,
        slug,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: ws.id,
        userId,
        role: "OWNER",
      },
    });

    return ws;
  });

  return {
    ...workspace,
    role: "OWNER",
  };
};

export const getUserWorkspaces = async (userId: string) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return memberships.map((membership) => ({
    ...membership.workspace,
    role: membership.role,
  }));
};

export const getWorkspaceById = async (
  workspaceId: string,
  userId: string
) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    throw new AppError("Workspace not found or access denied", 404);
  }

  return {
    ...membership.workspace,
    role: membership.role,
  };
};

export const updateWorkspace = async (
  workspaceId: string,
  userId: string,
  input: UpdateWorkspaceInput
) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("Workspace not found or access denied", 404);
  }

  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    throw new AppError("Insufficient permissions to update workspace", 403);
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.logo !== undefined && { logo: input.logo }),
    },
  });

  return {
    ...updatedWorkspace,
    role: membership.role,
  };
};

export const deleteWorkspace = async (
  workspaceId: string,
  userId: string
) => {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError("Workspace not found or access denied", 404);
  }

  if (membership.role !== "OWNER") {
    throw new AppError("Only the workspace owner can delete this workspace", 403);
  }

  await prisma.workspace.delete({
    where: { id: workspaceId },
  });
};
