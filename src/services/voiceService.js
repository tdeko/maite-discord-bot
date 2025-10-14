const logger = require('../utils/logger');
const { getUser, getAllUsers, updateTotalTime, addTime } = require('../db/userRepository');
const { getSessions, getActiveSessions, endSession, startSession } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

/**
 * Recalcule les temps totaux de tous les membres d’un serveur.
 */
async function handleStartupRecalculation(guild) {
    
    logger.info(`[${guild.name}] Starting voice time recalculation...`);
    // console.log(`🔁 Recalcul des temps vocaux pour ${guild.name}...`);

    for (const [id, member] of guild.members.cache) {
        if (member.user.bot) continue;

        const sessions = getSessions(id, guild.id, 0);
        const recalculated = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

        const user = getUser(id, guild.id);
        const old = user?.total_time || 0;

        if (old !== recalculated) {
            updateTotalTime(id, guild.id, recalculated);
            
            let fromTime = formatTime(old);
            let toTime = formatTime(recalculated);

            logger.warn(`${member.user.tag}: corrected ${fromTime} → ${toTime}`);
            // console.log(`🔄 ${member.user.tag}: corrigé ${fromTime} → ${toTime}`);
        }
    }

    logger.info(`[${guild.name}] Recalculation complete`);
    // console.log(`✅ Recalcul terminé pour ${guild.name}`);
}

/**
 * Ferme ou redémarre les sessions actives après un redémarrage du bot.
 */
async function handleActiveSessions(guild) {
    
    logger.info(`[${guild.name}] Checking active voice sessions...`);

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
                logger.warn(`Closed stale session for ${member?.user?.tag || s.user_id} (ended at last_save_time)`);
                // console.log(`🕓 Session clôturée à last_save_time pour ${member?.user?.tag || s.user_id}`);
            }
        } else {
            endSession(s.user_id, guildId, safeEnd);
            startSession(s.user_id, guildId, now);
            logger.warn(`Restarted session cleanly for ${member?.user?.tag || s.user_id}`);
            // console.log(`🎧 Session redémarrée proprement pour ${member?.user?.tag || s.user_id}`);
        }
    }

    logger.info(`[${guild.name}] Active session check done`);

}

module.exports = {
    handleStartupRecalculation,
    handleActiveSessions,
};
