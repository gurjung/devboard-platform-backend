import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Line 4: globalThis is Node's global memory (it never resets on file reload)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Lines 6–10: The Singleton Check
export const prisma =
  globalForPrisma.prisma || // <- 1. If it exists in global memory, REUSE it
  new PrismaClient({
    // <- 2. If it does NOT exist, create the ONE instance
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Line 12: In development, store it in global memory for the next reload
if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
