import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { registerSchema } from "../schemas/auth.schema";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), authController.register);
