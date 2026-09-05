// ============================================================
// Banza AI — Connexion MySQL (pool mysql2/promise)
// Toute requête DOIT utiliser des paramètres SQL positionnels :
//   execute("SELECT * FROM users WHERE id = ?", [id])
// ============================================================

import mysql from "mysql2/promise";
import { logger } from "../utils/logger.js";

const DB_HOST = process.env.DB_HOST || "127.0.0.1";
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "banza_ai";

let pool = null;

/** Crée et retourne le pool de connexions (singleton). */
export function getPool() {
  if (pool) return pool;

  logger.database("creating mysql pool", {
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
  });

  pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: "utf8mb4_unicode_ci",
    // Petites valeurs pour éviter les connexions mortes sur XAMPP/anti-veille
    connectTimeout: 10000,
    acquireTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

  // Log simple et sûr en cas de connexion rejetée
  pool.on("connection", () => {
    logger.database("connection acquired");
  });
  pool.on("error", (err) => {
    logger.error("mysql pool error", err.code || err.message);
  });

  return pool;
}

/** Exécute une requête SQL paramétrée (SELECT/autres). */
export async function query(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

/** Exécute une requête SQL paramétrée (INSERT/UPDATE/DELETE). */
export async function execute(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

/** Ping de disponibilité de la base (erreur => levée). */
export async function ping() {
  await getPool().query("SELECT 1");
  return true;
}

/** Ferme proprement le pool (lors de la fermeture du serveur). */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}