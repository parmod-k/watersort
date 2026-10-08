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
  } finally {
    await conn.end();
  }
}

if (import.meta.main) {
  await migrate();
  console.log(`Database "${dbConfig.database}" is up to date.`);
}
