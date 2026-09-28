import crypto from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import { generateSlug } from "../utils/slugify";
import {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema";

export const createProject = async (
  workspaceId: string,
  createdById: string,
  input: CreateProjectInput
) => {
  let slug = generateSlug(input.name);
  if (!slug) {
    slug = "project";
  }

  const existing = await prisma.project.findUnique({
    where: {
      workspaceId_slug: {
        workspaceId,
        slug,
      },
    },
  });

  if (existing) {
    slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
  }

  const project = await prisma.project.create({
    data: {
      name: input.name,
      slug,
      logo: input.logo,
      workspaceId,
      createdById,
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return project;
};

export const getWorkspaceProjects = async (workspaceId: string) => {
  return prisma.project.findMany({
    where: { workspaceId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getProjectById = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!project || project.workspaceId !== workspaceId) {
    throw new AppError("Project not found in this workspace", 404);
  }

  return project;
};

export const updateProject = async (
  workspaceId: string,
  projectId: string,
  input: UpdateProjectInput
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.workspaceId !== workspaceId) {
    throw new AppError("Project not found in this workspace", 404);
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.logo !== undefined && { logo: input.logo }),
    },
    include: {
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updatedProject;
};

export const deleteProject = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project || project.workspaceId !== workspaceId) {
    throw new AppError("Project not found in this workspace", 404);
  }

  await prisma.project.delete({
    where: { id: projectId },
  });
};
