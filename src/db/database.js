const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new Database(path.join(dataDir, 'database.db'));

db.prepare(`
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT,
    guild_id TEXT,
    username TEXT,
    total_time INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, guild_id)
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    guild_id TEXT,
    start INTEGER,
    end INTEGER,
    duration INTEGER,
    last_save_time INTEGER
)
`).run();

module.exports = db;
