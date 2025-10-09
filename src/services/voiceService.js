const { getUser, getAllUsers, updateTotalTime, addTime } = require('../db/userRepository');
const { getSessions, getActiveSessions, endSession, startSession } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

/**
 * Recalcule les temps totaux de tous les membres d’un serveur.
 */
async function handleStartupRecalculation(guild) {
    console.log(`🔁 Recalcul des temps vocaux pour ${guild.name}...`);

    for (const [id, member] of guild.members.cache) {
        if (member.user.bot) continue;

        const sessions = getSessions(id, guild.id, 0);
        const recalculated = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

        const user = getUser(id, guild.id);
        const old = user?.total_time || 0;

        if (old !== recalculated) {
            updateTotalTime(id, guild.id, recalculated);
            console.log(`🔄 ${member.user.tag}: corrigé ${formatTime(old)} → ${formatTime(recalculated)}`);
        }
    }

    console.log(`✅ Recalcul terminé pour ${guild.name}`);
}

/**
 * Ferme ou redémarre les sessions actives après un redémarrage du bot.
 */
async function handleActiveSessions(guild) {
    const guildId = guild.id;
    const now = Date.now();

    const activeSessions = getActiveSessions(null, guildId);

    for (const s of activeSessions) {
        const member = guild.members.cache.get(s.user_id);
        const stillConnected = member?.voice?.channel;
        const safeEnd = s.last_save_time || s.start;

        if (!stillConnected) {
            const duration = endSession(s.user_id, guildId, safeEnd);
            if (duration > 0) {
                addTime(s.user_id, guildId, duration);
                console.log(`🕓 Session clôturée à last_save_time pour ${member?.user?.tag || s.user_id}`);
            }
        } else {
            endSession(s.user_id, guildId, safeEnd);
            startSession(s.user_id, guildId, now);
            console.log(`🎧 Session redémarrée proprement pour ${member?.user?.tag || s.user_id}`);
        }
    }
}

module.exports = {
    handleStartupRecalculation,
    handleActiveSessions,
};
