import { Request, Response, NextFunction } from "express";
import * as memberService from "../services/member.service";

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

    res.status(200).json({
      success: true,
      message: "Member removed from workspace successfully",
    });
  } catch (error) {
    next(error);
  }
};
