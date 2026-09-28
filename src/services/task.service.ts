import { Prisma, TaskPriority, TaskStatus, WorkspaceRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/appError";
import {
  CreateTaskInput,
  GetTasksQuery,
  UpdateTaskInput,
} from "../schemas/task.schema";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
};

export const createTask = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  data: CreateTaskInput
) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    throw new AppError("Project not found in this workspace", 404);
  }

  if (data.assigneeId) {
    const assigneeMembership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: data.assigneeId },
    });

    if (!assigneeMembership) {
      throw new AppError("Assignee must be a member of this workspace", 400);
    }
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      dueDate: data.dueDate,
      projectId,
      assigneeId: data.assigneeId || null,
      createdById: userId,
    },
    include: {
      assignee: { select: safeUserSelect },
      createdBy: { select: safeUserSelect },
    },
  });
};

export const getTasks = async (
  workspaceId: string,
  projectId: string,
  query: GetTasksQuery
) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId },
  });

  if (!project) {
    throw new AppError("Project not found in this workspace", 404);
  }

  const where: Prisma.TaskWhereInput = {
    projectId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.assigneeId !== undefined) {
    if (query.assigneeId === "null" || query.assigneeId === "unassigned") {
      where.assigneeId = null;
    } else {
      where.assigneeId = query.assigneeId;
    }
  }

  if (query.dueDate) {
    const targetDate = new Date(query.dueDate);
    if (!isNaN(targetDate.getTime())) {
      const endOfDay = new Date(targetDate);
      endOfDay.setUTCHours(23, 59, 59, 999);
      where.dueDate = { lte: endOfDay };
    }
  }

  if (query.overdue === "true") {
    where.dueDate = { lt: new Date() };
    where.status = { not: TaskStatus.DONE };
  }

  const limit = query.pageSize ?? 20;
  const cursor = query.cursor;

  const [tasks, totalCount] = await Promise.all([
    prisma.task.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],
      include: {
        assignee: { select: safeUserSelect },
        createdBy: { select: safeUserSelect },
      },
    }),
    prisma.task.count({ where }),
  ]);

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, limit) : tasks;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    tasks: items,
    nextCursor,
    hasMore,
    totalCount,
  };
};

export const getTaskById = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      project: { workspaceId },
    },
    include: {
      assignee: { select: safeUserSelect },
      createdBy: { select: safeUserSelect },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  return task;
};

export const updateTask = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  userId: string,
  userRole: WorkspaceRole,
  data: UpdateTaskInput
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      project: { workspaceId },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const isCreator = task.createdById === userId;
  const isAssignee = task.assigneeId === userId;
  const isPrivileged =
    userRole === WorkspaceRole.ADMIN || userRole === WorkspaceRole.OWNER;

  if (!isCreator && !isAssignee && !isPrivileged) {
    throw new AppError("You do not have permission to update this task", 403);
  }

  if (data.assigneeId) {
    const assigneeMembership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: data.assigneeId },
    });

    if (!assigneeMembership) {
      throw new AppError("Assignee must be a member of this workspace", 400);
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: {
      assignee: { select: safeUserSelect },
      createdBy: { select: safeUserSelect },
    },
  });
};

export const deleteTask = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  userId: string,
  userRole: WorkspaceRole
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId,
      project: { workspaceId },
    },
  });

  if (!task) {
    throw new AppError("Task not found", 404);
  }

  const isCreator = task.createdById === userId;
  const isPrivileged =
    userRole === WorkspaceRole.ADMIN || userRole === WorkspaceRole.OWNER;

  if (!isCreator && !isPrivileged) {
    throw new AppError("You do not have permission to delete this task", 403);
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  return { success: true, message: "Task deleted successfully" };
};
