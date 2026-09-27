import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { env } from "../config/env";

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || "Internal Server Error";

  if (env.NODE_ENV === "development" && !(err instanceof AppError)) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
