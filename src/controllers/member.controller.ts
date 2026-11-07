import { Request, Response, NextFunction } from "express";
import * as memberService from "../services/member.service";
import * as notificationService from "../services/notification.service";
import { socketService } from "../socket/socketService";

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const members = await memberService.getWorkspaceMembers(workspaceId);

    res.status(200).json({
      success: true,
      message: "Workspace members retrieved successfully",
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const memberId = req.params.memberId as string;
    const { role } = req.body;

    const updatedMember = await memberService.updateMemberRole(
      workspaceId,
      memberId,
      req.workspaceMember!,
      role
    );

    // Broadcast member role update to workspace
    socketService.emitMemberUpdated(workspaceId, updatedMember, req.user!.userId);

    // Create persistent notification for affected member
    await notificationService.createNotification({
      userId: updatedMember.userId,
      workspaceId,
      type: "MEMBER_ROLE_UPDATED",
      title: "Workspace Role Updated",
      message: `Your role in this workspace was updated to ${role}`,
      link: `/dashboard/${workspaceId}/members`,
      actorId: req.user!.userId,
    });

    res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      data: updatedMember,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const workspaceId = req.params.workspaceId as string;
    const memberId = req.params.memberId as string;

    await memberService.removeMember(
      workspaceId,
      memberId,
      req.workspaceMember!
    );

    // Broadcast member removal to workspace
    socketService.emitMemberRemoved(workspaceId, memberId, req.user!.userId);

    res.status(200).json({
      success: true,
      message: "Member removed from workspace successfully",
    });
  } catch (error) {
    next(error);
  }
};
