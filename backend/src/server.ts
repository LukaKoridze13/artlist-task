import "dotenv/config";
import http from "http";
import { AddressInfo } from "net";
import { createApp } from "./app";
import logger from "./config/logger";
import { connectToDatabase } from "./config/db";
import { initSocketServer } from "./socket";

const app = createApp();
const server = http.createServer(app);

async function bootstrap() {
  const port = parseInt(process.env.PORT || "4000", 10);
  const mongoUri = process.env.MONGODB_URI || "";

  try {
    await connectToDatabase(mongoUri);

    const httpServer = server.listen(port, () => {
      const address = server.address() as AddressInfo | null;
      const boundPort = address?.port ?? port;
      logger.info({ port: boundPort }, `Server listening on port ${boundPort}`);
    });

    initSocketServer(httpServer);
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    process.exit(1);
  }
}

bootstrap();

