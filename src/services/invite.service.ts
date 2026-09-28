import crypto from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { CreateInviteInput } from "../schemas/invite.schema";
import { JwtUserPayload } from "../types/express";

export const createInvite = async (
  workspaceId: string,
  invitedById: string,
  input: CreateInviteInput
) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMember) {
      throw new AppError("User is already a member of this workspace", 400);
    }
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const existingInvite = await prisma.workspaceInvite.findUnique({
    where: {
      workspaceId_email: {
        workspaceId,
        email: input.email,
      },
    },
  });

  if (existingInvite) {
    return prisma.workspaceInvite.update({
      where: { id: existingInvite.id },
      data: {
        token,
        role: input.role,
        invitedById,
        status: "PENDING",
        expiresAt,
      },
      include: {
        workspace: { select: { id: true, name: true, slug: true } },
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  return prisma.workspaceInvite.create({
    data: {
      workspaceId,
      email: input.email,
      role: input.role,
      token,
      invitedById,
      status: "PENDING",
      expiresAt,
    },
    include: {
      workspace: { select: { id: true, name: true, slug: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });
};

export const getWorkspaceInvites = async (workspaceId: string) => {
  return prisma.workspaceInvite.findMany({
    where: { workspaceId },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const revokeInvite = async (
  workspaceId: string,
  inviteId: string
) => {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.workspaceId !== workspaceId) {
    throw new AppError("Invite not found in this workspace", 404);
  }

  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: "REVOKED" },
  });
};

export const getInviteByToken = async (token: string) => {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true, slug: true, logo: true } },
      invitedBy: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invite) {
    throw new AppError("Invite not found or invalid", 404);
  }

  const isExpired = invite.expiresAt < new Date();

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
    isExpired,
    workspace: invite.workspace,
    invitedBy: invite.invitedBy,
  };
};

export const acceptInvite = async (
  token: string,
  currentUser: JwtUserPayload
) => {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: {
      workspace: true,
    },
  });

  if (!invite) {
    throw new AppError("Invite not found or invalid", 404);
  }

  if (invite.status === "REVOKED") {
    throw new AppError("This invite has been revoked", 400);
  }

  if (invite.status === "ACCEPTED") {
    throw new AppError("This invite has already been accepted", 400);
  }

  if (invite.expiresAt < new Date() || invite.status === "EXPIRED") {
    if (invite.status !== "EXPIRED") {
      await prisma.workspaceInvite.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
    }
    throw new AppError("This invite has expired", 400);
  }

  if (currentUser.email.toLowerCase() !== invite.email.toLowerCase()) {
    throw new AppError("This invite was sent to a different email address", 403);
  }

  const existingMember = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: invite.workspaceId,
        userId: currentUser.userId,
      },
    },
  });

  if (existingMember) {
    await prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    return {
      workspace: invite.workspace,
      role: existingMember.role,
      alreadyMember: true,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const member = await tx.workspaceMember.create({
      data: {
        workspaceId: invite.workspaceId,
        userId: currentUser.userId,
        role: invite.role,
      },
    });

    await tx.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED" },
    });

    return member;
  });

  return {
    workspace: invite.workspace,
    role: result.role,
    alreadyMember: false,
  };
};
