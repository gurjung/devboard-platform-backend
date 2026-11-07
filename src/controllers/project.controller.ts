import { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service";
import { socketService } from "../socket/socketService";

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const project = await projectService.createProject(
      workspaceId,
      req.user!.userId,
      req.body
    );

    // Broadcast project creation to all workspace members
    socketService.emitProjectCreated(workspaceId, project, req.user!.userId);

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projects = await projectService.getWorkspaceProjects(workspaceId);

    res.status(200).json({
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;

    const project = await projectService.getProjectById(
      workspaceId,
      projectId
    );

    res.status(200).json({
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;

    const updatedProject = await projectService.updateProject(
      workspaceId,
      projectId,
      req.body
    );

    // Broadcast project update to workspace members
    socketService.emitProjectUpdated(workspaceId, updatedProject, req.user!.userId);

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const projectId = req.params.projectId as string;

    await projectService.deleteProject(workspaceId, projectId);

    // Broadcast project deletion to workspace members
    socketService.emitProjectDeleted(workspaceId, projectId, req.user!.userId);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
