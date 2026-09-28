import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/appError";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstError = result.error.issues[0]?.message || "Validation failed";
      return next(new AppError(firstError, 400));
    }

    req.body = result.data;
    next();
  };
