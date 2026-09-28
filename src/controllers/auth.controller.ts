import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/appError";
import * as authService from "../services/auth.service";

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await authService.registerUser(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user, accessToken, rawRefreshToken } = await authService.loginUser(
      req.body
    );

    res.cookie("refreshToken", rawRefreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user,
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rawRefreshToken = req.cookies.refreshToken;
    if (!rawRefreshToken) {
      throw new AppError("Refresh token is missing", 401);
    }

    const { accessToken, newRawRefreshToken } =
      await authService.rotateRefreshToken(rawRefreshToken);

    res.cookie("refreshToken", newRawRefreshToken, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
      },
    });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 403) {
      res.clearCookie("refreshToken", cookieOptions);
    }
    next(error);
  }
};

