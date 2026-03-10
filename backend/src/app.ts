import express, { Application } from "express";
import cors from "cors";
import healthRouter from "./routes/health.route";
import authRouter from "./routes/auth.route";

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(express.json());

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);

  return app;
}

