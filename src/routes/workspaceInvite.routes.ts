import { Router } from "express";
import * as inviteController from "../controllers/invite.controller";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole";
import { validate } from "../middlewares/validate";
import { createInviteSchema } from "../schemas/invite.schema";

export const workspaceInviteRouter = Router({ mergeParams: true });

workspaceInviteRouter.use(requireWorkspaceRole("ADMIN"));

workspaceInviteRouter.post(
  "/",
  validate(createInviteSchema),
  inviteController.createInvite
);

workspaceInviteRouter.get("/", inviteController.getInvites);

workspaceInviteRouter.delete("/:inviteId", inviteController.revokeInvite);
