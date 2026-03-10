import mongoose from "mongoose";
import logger from "./logger";

export async function connectToDatabase(mongoUri: string): Promise<void> {
  try {
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined");
    }

    await mongoose.connect(mongoUri);

    logger.info("Connected to MongoDB");

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("error", (error) => {
      logger.error({ error }, "MongoDB connection error");
    });
  } catch (error) {
    logger.error({ error }, "Failed to connect to MongoDB");
    throw error;
  }
}

