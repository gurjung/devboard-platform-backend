import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import {
  AuthenticatedSocket,
  socketAuthMiddleware,
} from "./socketAuth";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
  SocketUser,
} from "./types";
import { setIO } from "./socketService";

// Map: projectId -> Map<socketId, SocketUser>
const projectPresence = new Map<string, Map<string, SocketUser>>();

const getProjectUsers = (projectId: string): SocketUser[] => {
  const presenceMap = projectPresence.get(projectId);
  if (!presenceMap) return [];

  // Deduplicate by userId
  const uniqueUsers = new Map<string, SocketUser>();
  for (const user of presenceMap.values()) {
    uniqueUsers.set(user.userId, user);
  }
  return Array.from(uniqueUsers.values());
};

const broadcastProjectPresence = (
  io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>,
  projectId: string
) => {
  const users = getProjectUsers(projectId);
  io.to(`project:${projectId}`).emit("project:presence", {
    projectId,
    users,
  });
};

export const initSocketServer = (httpServer: HttpServer) => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Store instance for socketService
  setIO(io);

  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.data.user;

    // Join user's personal room for direct notifications
    socket.join(`user:${user.userId}`);

    // Join Workspace Room
    socket.on("join:workspace", async ({ workspaceId }) => {
      try {
        if (!workspaceId) return;

        // Verify membership
        const membership = await prisma.workspaceMember.findFirst({
          where: { workspaceId, userId: user.userId },
        });

        if (!membership) {
          socket.emit("error", {
            message: "Unauthorized: You are not a member of this workspace.",
          });
          return;
        }

        socket.join(`workspace:${workspaceId}`);
      } catch (err) {
        console.error("Error joining workspace room:", err);
      }
    });

    socket.on("leave:workspace", ({ workspaceId }) => {
      if (workspaceId) {
        socket.leave(`workspace:${workspaceId}`);
      }
    });

    // Join Project Room
    socket.on("join:project", async ({ projectId }) => {
      try {
        if (!projectId) return;

        const project = await prisma.project.findUnique({
          where: { id: projectId },
          select: { workspaceId: true },
        });

        if (!project) {
          socket.emit("error", { message: "Project not found." });
          return;
        }

        // Verify user is a member of the project's workspace
        const membership = await prisma.workspaceMember.findFirst({
          where: { workspaceId: project.workspaceId, userId: user.userId },
        });

        if (!membership) {
          socket.emit("error", {
            message: "Unauthorized: You do not have access to this project.",
          });
          return;
        }

        socket.join(`project:${projectId}`);
        socket.data.activeProjects.add(projectId);

        // Track presence
        if (!projectPresence.has(projectId)) {
          projectPresence.set(projectId, new Map());
        }
        projectPresence.get(projectId)!.set(socket.id, user);

        // Broadcast presence
        broadcastProjectPresence(io, projectId);
      } catch (err) {
        console.error("Error joining project room:", err);
      }
    });

    // Leave Project Room
    socket.on("leave:project", ({ projectId }) => {
      if (!projectId) return;

      socket.leave(`project:${projectId}`);
      socket.data.activeProjects.delete(projectId);

      const presenceMap = projectPresence.get(projectId);
      if (presenceMap) {
        presenceMap.delete(socket.id);
        if (presenceMap.size === 0) {
          projectPresence.delete(projectId);
        }
      }

      broadcastProjectPresence(io, projectId);
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      for (const projectId of socket.data.activeProjects) {
        const presenceMap = projectPresence.get(projectId);
        if (presenceMap) {
          presenceMap.delete(socket.id);
          if (presenceMap.size === 0) {
            projectPresence.delete(projectId);
          }
        }
        broadcastProjectPresence(io, projectId);
      }
      socket.data.activeProjects.clear();
    });
  });

  return io;
};

export * from "./types";
export * from "./socketService";

