import "dotenv/config";

import express from "express";
import { getAppEnv } from "./config/env";
import {
  initializeAuthSchema,
  initializeBookmarkSchema,
  testDatabaseConnection,
} from "./db/mysql";
import { createAuthRouter, createVaultAuthRouter } from "./auth/google";
import { createBookmarkRouter } from "./routes/bookmarkRoutes";

const app = express();
const appEnv = getAppEnv();
const port = appEnv.port;

app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && origin === appEnv.auth.frontendUrl) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.get("/", (_req, res) => {
  res.send("Server is running");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/db/health", async (_req, res) => {
  try {
    const result = await testDatabaseConnection();

    res.json({
      status: "ok",
      database: result.database,
      host: result.host,
      ssl: result.ssl,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    res.status(503).json({
      status: "error",
      message,
    });
  }
});

app.use("/auth", createAuthRouter(appEnv));
app.use("/auth/vault", createVaultAuthRouter(appEnv));
app.use("/bookmarks", createBookmarkRouter(appEnv));

async function bootstrap() {
  await testDatabaseConnection();
  await initializeAuthSchema();
  await initializeBookmarkSchema();

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);

    if (!appEnv.auth.enabled) {
      console.warn(
        "Google OAuth is disabled until GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI are set.",
      );
    }
  });
}

void bootstrap().catch((error) => {
  const message =
    error instanceof Error ? error.message : "Server bootstrap failed";

  console.error(`Failed to start server: ${message}`);
  process.exit(1);
});
