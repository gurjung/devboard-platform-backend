import { Request, Response, NextFunction } from "express";
import * as notificationService from "../services/notification.service";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const unreadOnly = req.query.unreadOnly === "true";
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined;
    const cursor = req.query.cursor as string | undefined;

    const result = await notificationService.getUserNotifications(userId, {
      unreadOnly,
      pageSize,
      cursor,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id as string;

    const result = await notificationService.markAsRead(userId, notificationId);

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;

    const result = await notificationService.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id as string;

    await notificationService.deleteNotification(userId, notificationId);

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

