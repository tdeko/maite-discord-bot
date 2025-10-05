const db = require('./database');

// démarre une nouvelle session
function startSession(userId, guildId, start) {
    db.prepare(`
        INSERT INTO sessions (user_id, guild_id, start, last_save_time)
        VALUES (?, ?, ?, ?)
    `).run(userId, guildId, start, start);
}

// clôture une session
function endSession(userId, guildId, endTime) {
    const session = db.prepare(`
        SELECT * FROM sessions
        WHERE user_id = ? AND guild_id = ? AND end IS NULL
        ORDER BY start DESC LIMIT 1
    `).get(userId, guildId);

    if (session) {
        const duration = Math.floor((endTime - session.start) / 1000);
        db.prepare(`
            UPDATE sessions
            SET end = ?, duration = ?
            WHERE id = ?
        `).run(endTime, duration, session.id);
        return duration;
    }
    return 0;
}

// récupère toutes les sessions depuis une date
function getSessions(userId, guildId, since) {
    return db.prepare(`
        SELECT * FROM sessions
        WHERE user_id = ? AND guild_id = ? AND end >= ?
    `).all(userId, guildId, since);
}

// récupère les sessions encore ouvertes
function getActiveSessions() {
    return db.prepare(`SELECT * FROM sessions WHERE end IS NULL`).all();
}

// met à jour la dernière sauvegarde d'une session
function updateLastSave(userId, guildId, timestamp) {
    db.prepare(`
        UPDATE sessions
        SET last_save_time = ?
        WHERE user_id = ? AND guild_id = ? AND end IS NULL
    `).run(timestamp, userId, guildId);
}

module.exports = {
    startSession,
    endSession,
    getSessions,
    getActiveSessions,
    updateLastSave
};
