import "./src/config/env.js";
import { createServer } from "node:http";
import { PORT } from "./src/config/server.js";
import { createApp } from "./src/app.js";

const app = createApp();
let currentPort = PORT;
let retryTimer = null;
const server = createServer((req, res) => {
  app(req, res).catch((error) => {
    console.error(error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end("<h1>500</h1><p>LearnLink Node.js encountered an unexpected error.</p>");
  });
});

function listen(preferredPort) {
  currentPort = preferredPort;
  server.listen(preferredPort);
}

server.on("listening", () => {
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : currentPort;
  console.log(`LearnLink Node.js running at http://127.0.0.1:${port}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    const nextPort = currentPort + 1;
    console.log(`Port ${currentPort} is busy. Trying http://127.0.0.1:${nextPort} instead...`);
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      listen(nextPort);
    }, 100);
    return;
  }

  throw error;
});

listen(PORT);
