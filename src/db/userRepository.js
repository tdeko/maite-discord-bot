const db = require('./database');

function ensureUser(userId, guildId, username) {
    db.prepare(`
        INSERT OR IGNORE INTO users (user_id, guild_id, username)
        VALUES (?, ?, ?)
    `).run(userId, guildId, username);
}

function addTime(userId, guildId, seconds) {
    db.prepare(`
        UPDATE users
        SET total_time = total_time + ?
        WHERE user_id = ? AND guild_id = ?
    `).run(seconds, userId, guildId);
}

function getUser(userId, guildId) {
    return db.prepare(`SELECT * FROM users WHERE user_id = ? AND guild_id = ?`).get(userId, guildId);
}

function updateTotalTime(userId, guildId, newTotal) {
    db.prepare(`
        UPDATE users
        SET total_time = ?
        WHERE user_id = ? AND guild_id = ?
    `).run(newTotal, userId, guildId);
}

module.exports = { ensureUser, addTime, getUser, updateTotalTime };
