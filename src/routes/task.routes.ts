import { Router } from "express";
import * as taskController from "../controllers/task.controller";
import { validate } from "../middlewares/validate";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema";

export const taskRouter = Router({ mergeParams: true });

taskRouter.get("/", taskController.getTasks);
taskRouter.post("/", validate(createTaskSchema), taskController.createTask);
taskRouter.get("/:taskId", taskController.getTaskById);
taskRouter.patch("/:taskId", validate(updateTaskSchema), taskController.updateTask);
taskRouter.delete("/:taskId", taskController.deleteTask);
