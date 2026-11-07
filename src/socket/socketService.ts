import { Server } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./types";

let ioInstance: Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
> | null = null;

export const setIO = (
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >
) => {
  ioInstance = io;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized yet!");
  }
  return ioInstance;
};

export const socketService = {
  emitTaskCreated: (projectId: string, task: any, actorId: string) => {
    if (!ioInstance) return;
    ioInstance.to(`project:${projectId}`).emit("task:created", {
      task,
      actorId,
    });
  },

  emitTaskUpdated: (projectId: string, task: any, actorId: string) => {
    if (!ioInstance) return;
    ioInstance.to(`project:${projectId}`).emit("task:updated", {
      task,
      actorId,
    });
  },

  emitTaskDeleted: (projectId: string, taskId: string, actorId: string) => {
    if (!ioInstance) return;
    ioInstance.to(`project:${projectId}`).emit("task:deleted", {
      taskId,
      actorId,
    });
  },

  emitTaskAssigned: (
    assigneeId: string,
    task: any,
    assignedBy: { userId: string; email: string }
  ) => {
    if (!ioInstance) return;
    ioInstance.to(`user:${assigneeId}`).emit("task:assigned", {
      task,
      assignedBy,
    });
  },
};
