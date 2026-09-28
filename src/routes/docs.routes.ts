import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openapiSpec } from "../docs/openapi";

export const docsRouter = Router();

docsRouter.get("/json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json(openapiSpec);
});

docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(openapiSpec, {
  customSiteTitle: "DevBoard API Documentation",
}));
