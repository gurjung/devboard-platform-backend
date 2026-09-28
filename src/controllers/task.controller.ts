import { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service";
import {
  getMyTasksQuerySchema,
  getTasksQuerySchema,
} from "../schemas/task.schema";
import { AppError } from "../utils/appError";

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

