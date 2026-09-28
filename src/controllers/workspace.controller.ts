import { Request, Response, NextFunction } from "express";
import * as workspaceService from "../services/workspace.service";

export const createWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspace = await workspaceService.createWorkspace(
      req.user!.userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaces = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaces = await workspaceService.getUserWorkspaces(
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "Workspaces retrieved successfully",
      data: workspaces,
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkspaceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const workspace = await workspaceService.getWorkspaceById(
      workspaceId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "Workspace retrieved successfully",
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const updatedWorkspace = await workspaceService.updateWorkspace(
      workspaceId,
      req.user!.userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Workspace updated successfully",
      data: updatedWorkspace,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    await workspaceService.deleteWorkspace(
      workspaceId,
      req.user!.userId
    );

    res.status(200).json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

