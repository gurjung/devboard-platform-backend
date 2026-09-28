import { Router } from "express";
import * as projectController from "../controllers/project.controller";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole";
import { validate } from "../middlewares/validate";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/project.schema";

export const projectRouter = Router({ mergeParams: true });

projectRouter.use(requireWorkspaceRole("MEMBER"));

projectRouter.get("/", projectController.getProjects);

projectRouter.post(
  "/",
  requireWorkspaceRole("ADMIN"),
  validate(createProjectSchema),
  projectController.createProject
);

projectRouter.get("/:projectId", projectController.getProjectById);

projectRouter.patch(
  "/:projectId",
  requireWorkspaceRole("ADMIN"),
  validate(updateProjectSchema),
  projectController.updateProject
);

projectRouter.delete(
  "/:projectId",
  requireWorkspaceRole("ADMIN"),
  projectController.deleteProject
);
