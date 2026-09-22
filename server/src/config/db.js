import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { schemaSql } from './schemaSql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel serverless functions, only /tmp is writable
const isVercel = Boolean(process.env.VERCEL);
const dataDir = isVercel ? '/tmp' : path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pharma.db');
const db = new Database(dbPath);

// Cache prepared statements to prevent Node 24+ GC cleanup hook crash and optimize query performance
const stmtCache = new Map();
const originalPrepare = db.prepare.bind(db);
db.prepare = function(sql) {
  let stmt = stmtCache.get(sql);
  if (!stmt) {
    stmt = originalPrepare(sql);
    stmtCache.set(sql, stmt);
  }
  return stmt;
};

// Initialize schema & pragmas
export function initDatabase() {
  try {
    db.pragma('journal_mode = WAL');
  } catch (e) {
    // Some serverless environments may not support WAL mode
    db.pragma('journal_mode = DELETE');
  }
  db.pragma('foreign_keys = ON');
  
  if (schemaSql) {
    db.exec(schemaSql);
  } else {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlContent = fs.readFileSync(schemaPath, 'utf8');
      db.exec(sqlContent);
    }
  }
}

export default db;


