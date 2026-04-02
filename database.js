const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 100,
        daily_last_claimed TEXT DEFAULT '0',
        total_gambled INTEGER DEFAULT 0,
        biggest_win INTEGER DEFAULT 0,
        months_won INTEGER DEFAULT 0
    )`);

db.exec(`
    CREATE TABLE IF NOT EXISTS archived_messages (
        message_id TEXT PRIMARY KEY,
        author_id TEXT,
        content TEXT,
        saved_at INTEGER
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist_games (
        game_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        thumb TEXT,
        added_by TEXT NOT NULL,
        added_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS wishlist_notifications (
        game_id TEXT NOT NULL,
        deal_id TEXT NOT NULL,
        notified_at INTEGER NOT NULL DEFAULT (unixepoch()),
        price TEXT NOT NULL,
        PRIMARY KEY (game_id, deal_id)
    )
`);

console.log("Database ready");

module.exports = db;
