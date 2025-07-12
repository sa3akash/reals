import { S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import { Agent } from "https";

import mongoose from "mongoose";

export const S3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    httpsAgent: new Agent({
      keepAlive: true,
      maxSockets: 1000, // 🟢 Increase from 50 (default) to 1000
    }),
    socketTimeout: 30000, // Optional: increase timeout
  }),
});

let isConnected = false;

export const mongooseConnection = async () => {
  // If already connected or connecting, return
  if (
    mongoose.connection.readyState === 1 ||
    mongoose.connection.readyState === 2
  ) {
    console.log("Mongoose is already connected or connecting.");
    return;
  }

  // Set up connection event listeners once
  if (!isConnected) {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to DB!");
      isConnected = true;
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
      isConnected = false; // Reset connection status on error
      // You might want to implement a retry mechanism here
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from DB.");
      isConnected = false; // Reset connection status on disconnect
      // This can happen due to network issues, server restarts, etc.
      // Mongoose will attempt to reconnect if useUnifiedTopology is true
    });

    mongoose.connection.on("reconnected", () => {
      console.log("Mongoose reconnected to DB.");
      isConnected = true;
    });
  }

  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000,
      dbName: process.env.MONGODB_DB_NAME || "upload",
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    isConnected = false; // Ensure connection status is false on initial connection failure
    process.exit(1); // Exit with a failure code
  }
};
