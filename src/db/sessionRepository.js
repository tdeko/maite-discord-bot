const logger = require('../utils/logger');
const db = require('./database');
const { client } = require('../core/client');

// démarre une nouvelle session
function startSession(userId, guildId, start) {
    db.prepare(`
        INSERT INTO sessions (user_id, guild_id, start, last_save_time)
        VALUES (?, ?, ?, ?)
    `).run(userId, guildId, start, start);

    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members?.cache?.get(userId);
    const username = member?.user?.tag || userId;
    logger.info(`[Session] Started new session for ${username} in guild ${guild?.name || guildId}`);
}

// clôture une session
function endSession(userId, guildId, endTime) {
    const session = db.prepare(`
        SELECT * FROM sessions
        WHERE user_id = ? AND guild_id = ? AND end IS NULL
        ORDER BY start DESC LIMIT 1
    `).get(userId, guildId);

    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members?.cache?.get(userId);
    const username = member?.user?.tag || userId;

    if (session) {
        const duration = Math.floor((endTime - session.start) / 1000);
        db.prepare(`
            UPDATE sessions
            SET end = ?, duration = ?
            WHERE id = ?
        `).run(endTime, duration, session.id);

        logger.info(`[Session] Ended session for ${username} — duration: ${formatTime(duration)} in guild ${guild?.name || guildId}`);

        return duration;
    }

    logger.warn(`[Session] Tried to end session for ${username}, but no active session found in guild ${guild?.name || guildId}`);
    return 0;
}

// récupère toutes les sessions depuis une date
// récupère uniquement les sessions terminées depuis une date
function getSessions(userId, guildId, since) {
    return db.prepare(`
        SELECT * FROM sessions
        WHERE user_id = ?
          AND guild_id = ?
          AND end IS NOT NULL
          AND end >= ?
        ORDER BY end ASC
    `).all(userId, guildId, since);
}

// récupère les sessions encore ouvertes
function getActiveSessions(userId = null, guildId = null) {
    let query = `SELECT * FROM sessions WHERE end IS NULL`;
    const params = [];

    if (userId) {
        query += ` AND user_id = ?`;
        params.push(userId);
    }
    if (guildId) {
        query += ` AND guild_id = ?`;
        params.push(guildId);
    }

    return db.prepare(query).all(...params);
}

// Une seule session active pour un user précis
function getActiveSession(userId, guildId) {
    return getActiveSessions(userId, guildId)[0] || null;
}

// met à jour la dernière sauvegarde d'une session
function updateLastSave(userId, guildId, timestamp) {
    db.prepare(`
        UPDATE sessions
        SET last_save_time = ?
        WHERE id = (
            SELECT id FROM sessions
            WHERE user_id = ? AND guild_id = ? AND end IS NULL
            ORDER BY start DESC
            LIMIT 1
        )
    `).run(timestamp, userId, guildId);
}


module.exports = {
    startSession,
    endSession,
    getSessions,
    getActiveSessions,
    getActiveSession,
    updateLastSave
};
