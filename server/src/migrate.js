import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { dbConfig } from './db.js';

/** Creates the database if needed, then applies schema.sql (every statement is idempotent). */
export async function migrate(config = dbConfig) {
  const { database, ...server } = config;
  const conn = await mysql.createConnection({ ...server, multipleStatements: true });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${database}\``);
    await conn.query(await readFile(new URL('../schema.sql', import.meta.url), 'utf8'));
    await moveLegacyTokens(conn, database);
  } finally {
    await conn.end();
  }
}

/** Databases created before multi-device sign-in kept one token per player on the players table. */
async function moveLegacyTokens(conn, database) {
  const [cols] = await conn.query(
    `SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'players' AND COLUMN_NAME = 'token_hash'`,
    [database],
  );
  if (cols.length === 0) return;
  await conn.query('INSERT IGNORE INTO player_tokens (token_hash, player_id) SELECT token_hash, id FROM players');
  await conn.query('ALTER TABLE players DROP COLUMN token_hash');
}

if (import.meta.main) {
  await migrate();
  console.log(`Database "${dbConfig.database}" is up to date.`);
}
