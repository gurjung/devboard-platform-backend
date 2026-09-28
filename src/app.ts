import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/health", healthRouter);
app.use("/auth", authRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
