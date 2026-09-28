import { Request, Response, NextFunction } from "express";
import * as inviteService from "../services/invite.service";

export const createInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const invite = await inviteService.createInvite(
      workspaceId,
      req.user!.userId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Invite created successfully",
      data: invite,
    });
  } catch (error) {
    next(error);
  }
};

export const getInvites = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const invites = await inviteService.getWorkspaceInvites(workspaceId);

    res.status(200).json({
      success: true,
      message: "Workspace invites retrieved successfully",
      data: invites,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const inviteId = req.params.inviteId as string;

    await inviteService.revokeInvite(workspaceId, inviteId);

    res.status(200).json({
      success: true,
      message: "Invite revoked successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getInvitePreview = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.params.token as string;
    const invitePreview = await inviteService.getInviteByToken(token);

    res.status(200).json({
      success: true,
      message: "Invite preview retrieved successfully",
      data: invitePreview,
    });
  } catch (error) {
    next(error);
  }
};

export const acceptInvite = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.params.token as string;
    const result = await inviteService.acceptInvite(token, req.user!);

    res.status(200).json({
      success: true,
      message: "Workspace invite accepted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
