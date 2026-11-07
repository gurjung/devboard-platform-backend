import { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import * as notificationService from "../services/notification.service";
import {
  getMyTasksQuerySchema,
  getTasksQuerySchema,
} from "../schemas/task.schema";
import { AppError } from "../utils/appError";
import { socketService } from "../socket/socketService";

export const createTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;
    const userId = req.user!.userId;

    const task = await taskService.createTask(
      workspaceId,
      projectId,
      userId,
      req.body
    );

    // Broadcast real-time task creation to project room
    socketService.emitTaskCreated(projectId, task, userId);

    // If assigned to another user, persist notification and send direct alert
    if (task.assigneeId && task.assigneeId !== userId) {
      socketService.emitTaskAssigned(task.assigneeId, task, {
        userId: req.user!.userId,
        email: req.user!.email,
      });

      await notificationService.createNotification({
        userId: task.assigneeId,
        workspaceId,
        type: "TASK_ASSIGNED",
        title: "Task Assigned",
        message: `You were assigned to "${task.title}"`,
        link: `/dashboard/${workspaceId}/projects/${projectId}?taskId=${task.id}`,
        actorId: userId,
      });
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const getTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;

    const parsedQuery = getTasksQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      const firstError =
        parsedQuery.error.issues[0]?.message || "Invalid query parameters";
      return next(new AppError(firstError, 400));
    }

    const result = await taskService.getTasks(
      workspaceId,
      projectId,
      parsedQuery.data
    );

    res.status(200).json({
      success: true,
      message: "Tasks retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;
    const taskId = req.params.taskId as string;

    const task = await taskService.getTaskById(
      workspaceId,
      projectId,
      taskId
    );

    res.status(200).json({
      success: true,
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;
    const taskId = req.params.taskId as string;
    const userId = req.user!.userId;
    const userRole = req.workspaceMember!.role;

    const updatedTask = await taskService.updateTask(
      workspaceId,
      projectId,
      taskId,
      userId,
      userRole,
      req.body
    );

    // Broadcast real-time task update to project room
    socketService.emitTaskUpdated(projectId, updatedTask, userId);

    // If assigned/reassigned to another user, persist notification and send direct alert
    if (
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== userId &&
      req.body.assigneeId !== undefined &&
      req.body.assigneeId === updatedTask.assigneeId
    ) {
      socketService.emitTaskAssigned(updatedTask.assigneeId, updatedTask, {
        userId: req.user!.userId,
        email: req.user!.email,
      });

      await notificationService.createNotification({
        userId: updatedTask.assigneeId,
        workspaceId,
        type: "TASK_ASSIGNED",
        title: "Task Assigned",
        message: `You were assigned to "${updatedTask.title}"`,
        link: `/dashboard/${workspaceId}/projects/${projectId}?taskId=${updatedTask.id}`,
        actorId: userId,
      });
    }

    // If status changed and assignee is someone else, notify them
    if (
      req.body.status &&
      updatedTask.assigneeId &&
      updatedTask.assigneeId !== userId
    ) {
      await notificationService.createNotification({
        userId: updatedTask.assigneeId,
        workspaceId,
        type: "TASK_STATUS_CHANGED",
        title: "Task Status Updated",
        message: `"${updatedTask.title}" was moved to ${updatedTask.status}`,
        link: `/dashboard/${workspaceId}/projects/${projectId}?taskId=${updatedTask.id}`,
        actorId: userId,
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;
    const taskId = req.params.taskId as string;
    const userId = req.user!.userId;
    const userRole = req.workspaceMember!.role;

    const result = await taskService.deleteTask(
      workspaceId,
      projectId,
      taskId,
      userId,
      userRole
    );

    // Broadcast real-time task deletion to project room
    socketService.emitTaskDeleted(projectId, taskId, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyTasks = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const userId = req.user!.userId;

    const parsedQuery = getMyTasksQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      const firstError =
        parsedQuery.error.issues[0]?.message || "Invalid query parameters";
      return next(new AppError(firstError, 400));
    }

    const result = await taskService.getMyTasks(
      workspaceId,
      userId,
      parsedQuery.data
    );

    res.status(200).json({
      success: true,
      message: "My tasks retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
