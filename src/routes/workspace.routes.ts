import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller";
import { memberRouter } from "./member.routes";
import { workspaceInviteRouter } from "./workspaceInvite.routes";
import { projectRouter } from "./project.routes";
import { authenticate } from "../middlewares/authenticate";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole";
import { validate } from "../middlewares/validate";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "../schemas/workspace.schema";

export const workspaceRouter = Router();

workspaceRouter.use(authenticate);

workspaceRouter.post(
  "/",
  validate(createWorkspaceSchema),
  workspaceController.createWorkspace
);

workspaceRouter.get("/", workspaceController.getWorkspaces);

workspaceRouter.get(
  "/:workspaceId",
  requireWorkspaceRole("MEMBER"),
  workspaceController.getWorkspaceById
);

workspaceRouter.patch(
  "/:workspaceId",
  requireWorkspaceRole("ADMIN"),
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

workspaceRouter.delete(
  "/:workspaceId",
  requireWorkspaceRole("OWNER"),
  workspaceController.deleteWorkspace
);

workspaceRouter.use("/:workspaceId/members", memberRouter);
workspaceRouter.use("/:workspaceId/invites", workspaceInviteRouter);
workspaceRouter.use("/:workspaceId/projects", projectRouter);



