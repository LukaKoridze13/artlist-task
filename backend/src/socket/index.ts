import type { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import logger from "../config/logger";

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  ioInstance = io;

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "New WebSocket connection established");

    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "WebSocket disconnected");
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

