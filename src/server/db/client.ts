import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = path.resolve(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure uploads directory exists
const uploadsDir = path.resolve(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, "recopoint.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-create tables if they don't exist
function ensureTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      wallet_address TEXT NOT NULL UNIQUE,
      wallet_secret_enc TEXT NOT NULL,
      crypto_balance REAL NOT NULL DEFAULT 5.0,
      role TEXT NOT NULL DEFAULT 'buyer',
      created_at TEXT NOT NULL
    );
  `);

  // Migrations for existing databases
  const safeAlter = (sql: string) => {
    try { sqlite.exec(sql); } catch { /* column exists */ }
  };
  safeAlter("ALTER TABLE users ADD COLUMN crypto_balance REAL NOT NULL DEFAULT 5.0;");
  safeAlter("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'buyer';");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      location TEXT NOT NULL,
      waste_type TEXT NOT NULL,
      amount TEXT NOT NULL,
      image_data_url TEXT,
      verification_result_json TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      collector_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      entry_type TEXT NOT NULL,
      amount_credits INTEGER NOT NULL,
      description TEXT NOT NULL,
      related_ref TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS upi_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      transaction_id TEXT NOT NULL UNIQUE,
      upi_url TEXT NOT NULL,
      amount_inr INTEGER NOT NULL,
      credits_added INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      utr TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet_txs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      tx_hash TEXT NOT NULL UNIQUE,
      to_address TEXT NOT NULL,
      amount_credits INTEGER NOT NULL,
      memo TEXT,
      signature TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Marketplace
    CREATE TABLE IF NOT EXISTS marketplace_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      image_path TEXT NOT NULL,
      ai_classification TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      starting_price INTEGER NOT NULL,
      current_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      auction_ends_at TEXT,
      winner_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES marketplace_items(id),
      bidder_id INTEGER NOT NULL REFERENCES users(id),
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Messaging
    CREATE TABLE IF NOT EXISTS chat_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER REFERENCES marketplace_items(id),
      buyer_id INTEGER NOT NULL REFERENCES users(id),
      seller_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      thread_id INTEGER NOT NULL REFERENCES chat_threads(id),
      sender_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

ensureTables();

export { sqlite };
