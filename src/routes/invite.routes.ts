import { Router } from "express";
import * as inviteController from "../controllers/invite.controller";
import { authenticate } from "../middlewares/authenticate";

export const inviteRouter = Router();

inviteRouter.get("/:token", inviteController.getInvitePreview);
inviteRouter.post("/:token/accept", authenticate, inviteController.acceptInvite);
