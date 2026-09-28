import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { workspaceRouter } from "./routes/workspace.routes";
import { inviteRouter } from "./routes/invite.routes";
import { docsRouter } from "./routes/docs.routes";
import helmet from "helmet";
import { globalLimiter, authLimiter } from "./middlewares/rateLimiter";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

app.use("/api-docs", docsRouter);
app.use("/health", healthRouter);
app.use("/auth", authLimiter, authRouter);
app.use("/workspaces", workspaceRouter);
app.use("/invites", inviteRouter);

app.use(notFoundHandler);
app.use(errorHandler);



export default app;
