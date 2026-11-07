import http from "node:http";
import app from "./app";
import { env } from "./config/env";
import { initSocketServer } from "./socket";

const server = http.createServer(app);
const io = initSocketServer(server);

server.listen(env.PORT, () => {
  console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
});

const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  io.close(() => {
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
};

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
