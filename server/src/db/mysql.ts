import mysql from "mysql2/promise";
import { getAppEnv } from "../config/env";

const appEnv = getAppEnv();

export const pool = mysql.createPool({
  host: appEnv.mysql.host,
  port: appEnv.mysql.port,
  user: appEnv.mysql.user,
  password: appEnv.mysql.password,
  database: appEnv.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: appEnv.mysql.ssl,
});

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.ping();

    return {
      database: appEnv.mysql.database,
      host: appEnv.mysql.host,
      ssl: Boolean(appEnv.mysql.ssl),
    };
  } finally {
    connection.release();
  }
}
