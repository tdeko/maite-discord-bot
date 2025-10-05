const {
    getActiveSessions,
    endSession,
    updateLastSave
} = require('../db/sessionRepository');
const { addTime } = require('../db/userRepository');
const { client } = require('../core/client');

function updateActiveSessions() {
    const now = Date.now();
    const active = getActiveSessions();

    for (const s of active) {
        const guild = client.guilds.cache.get(s.guild_id);
        if (!guild) continue;

        const member = guild.members.cache.get(s.user_id);
        const stillConnected = member?.voice?.channel;

        if (stillConnected) {
            // met à jour last_save_time tant que la personne est présente
            updateLastSave(s.user_id, s.guild_id, now);
        } else {
            // clôture à la dernière sauvegarde connue, pas à NOW
            const safeEnd = s.last_save_time || s.start;
            const duration = endSession(s.user_id, s.guild_id, safeEnd);

            if (duration > 0) {
                addTime(s.user_id, s.guild_id, duration);
                console.log(`🕓 Session clôturée automatiquement à last_save_time pour ${s.user_id}`);
            }
        }
    }
}

module.exports = { updateActiveSessions };
