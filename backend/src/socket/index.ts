import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import logger from "../config/logger";

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "New WebSocket connection established");

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "WebSocket disconnected");
    });
  });

  return io;
}

