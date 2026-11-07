import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { socketService } from "../socket/socketService";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
};

export interface CreateNotificationParams {
  userId: string;
  workspaceId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actorId?: string;
}

export interface GetNotificationsQuery {
  unreadOnly?: boolean;
  pageSize?: number;
  cursor?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  // Prevent notifying self
  if (params.actorId && params.actorId === params.userId) {
    return null;
  }

  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      workspaceId: params.workspaceId || null,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      actorId: params.actorId || null,
    },
    include: {
      actor: { select: safeUserSelect },
    },
  });

  // Push instant WebSocket alert to user's personal channel
  socketService.emitNotification(params.userId, notification);

  return notification;
};

export const getUserNotifications = async (
  userId: string,
  query: GetNotificationsQuery
) => {
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(query.unreadOnly ? { isRead: false } : {}),
  };

  const limit = query.pageSize ?? 30;
  const cursor = query.cursor;

  const [notifications, unreadCount, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: safeUserSelect },
      },
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
    prisma.notification.count({ where }),
  ]);

  const hasMore = notifications.length > limit;
  const items = hasMore ? notifications.slice(0, limit) : notifications;
  const nextCursor =
    hasMore && items.length > 0 ? items[items.length - 1].id : null;

  return {
    notifications: items,
    unreadCount,
    totalCount,
    hasMore,
    nextCursor,
  };
};

export const markAsRead = async (userId: string, notificationId: string) => {
  const notification = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return { success: true, unreadCount };
};

export const markAllAsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return { success: true, unreadCount: 0 };
};

export const deleteNotification = async (
  userId: string,
  notificationId: string
) => {
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });

  return { success: true };
};

