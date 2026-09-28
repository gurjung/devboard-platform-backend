import { Router } from "express";
import * as memberController from "../controllers/member.controller";
import { requireWorkspaceRole } from "../middlewares/requireWorkspaceRole";
import { validate } from "../middlewares/validate";
import { updateMemberRoleSchema } from "../schemas/member.schema";

export const memberRouter = Router({ mergeParams: true });

memberRouter.use(requireWorkspaceRole("MEMBER"));

memberRouter.get("/", memberController.getMembers);

memberRouter.patch(
  "/:memberId",
  requireWorkspaceRole("ADMIN"),
  validate(updateMemberRoleSchema),
  memberController.updateRole
);

memberRouter.delete("/:memberId", memberController.removeMember);
