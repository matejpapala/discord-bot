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

console.log("Database ready");

module.exports = db;
