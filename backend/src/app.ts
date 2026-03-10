import express, { Application } from "express";
import healthRouter from "./routes/health.route";

export function createApp(): Application {
  const app = express();

  app.use(express.json());

  app.use("/api", healthRouter);

  return app;
}

