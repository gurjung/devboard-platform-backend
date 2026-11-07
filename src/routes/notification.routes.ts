import { Router } from "express";
import { authenticate } from "../middlewares/authenticate";
import * as notificationController from "../controllers/notification.controller";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get("/", notificationController.getNotifications);
notificationRouter.patch("/read-all", notificationController.markAllAsRead);
notificationRouter.patch("/:id/read", notificationController.markAsRead);
notificationRouter.delete("/:id", notificationController.deleteNotification);

