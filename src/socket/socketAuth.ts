import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { JwtUserPayload } from "../types/express";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "./types";

export type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

export const socketAuthMiddleware = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) => {
  try {
    const authHeader = socket.handshake.headers.authorization;
    const token =
      socket.handshake.auth?.token ||
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null);

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtUserPayload;

    if (!decoded || !decoded.userId) {
      return next(new Error("Authentication error: Invalid token"));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.data.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
    };
    socket.data.activeProjects = new Set<string>();

    next();
  } catch {
    next(new Error("Authentication error: Invalid or expired token"));
  }
};

