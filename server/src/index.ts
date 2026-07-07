import "dotenv/config";

import express from "express";
import { getAppEnv } from "./config/env";
import { testDatabaseConnection } from "./db/mysql";

const app = express();
const appEnv = getAppEnv();
const port = appEnv.port;

app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

void testDatabaseConnection()
  .then(() => {
    console.log("Database connection check passed");
  })
  .catch((error) => {
    const message =
      error instanceof Error ? error.message : "Database connection failed";

    console.warn(`Database connection check failed: ${message}`);
  });
