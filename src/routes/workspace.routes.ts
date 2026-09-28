import { Router } from "express";
import * as workspaceController from "../controllers/workspace.controller";
import { authenticate } from "../middlewares/authenticate";
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

workspaceRouter.get("/:workspaceId", workspaceController.getWorkspaceById);

workspaceRouter.patch(
  "/:workspaceId",
  validate(updateWorkspaceSchema),
  workspaceController.updateWorkspace
);

workspaceRouter.delete("/:workspaceId", workspaceController.deleteWorkspace);
