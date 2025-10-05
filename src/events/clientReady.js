const { ensureUser, addTime } = require('../db/userRepository');
const { getActiveSessions, endSession, startSession } = require('../db/sessionRepository');

module.exports = async (client) => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    const now = Date.now();

    for (const [guildId, guild] of client.guilds.cache) {
        await guild.members.fetch();

        // Vérifie que chaque membre est bien initialisé en DB
        guild.members.cache.forEach(member => {
            ensureUser(member.id, guildId, member.user.tag);
        });

        // Récupère toutes les sessions encore ouvertes
        const activeSessions = getActiveSessions().filter(s => s.guild_id === guildId);

        for (const s of activeSessions) {
            const member = guild.members.cache.get(s.user_id);
            const stillConnected = member?.voice?.channel;
            const safeEnd = s.last_save_time || s.start;

            // Si la personne n'est plus connectée : on clôture à la dernière sauvegarde connue
            if (!stillConnected) {
                const duration = endSession(s.user_id, guildId, safeEnd);
                if (duration > 0) {
                    addTime(s.user_id, guildId, duration);
                    console.log(`🕓 Session clôturée à last_save_time pour ${s.user_id}`);
                }
            }

            // Si la personne est toujours connectée : on clôture puis on redémarre une nouvelle session
            else {
                endSession(s.user_id, guildId, safeEnd);
                startSession(s.user_id, guildId, now);
                console.log(`🎧 Session redémarrée proprement pour ${s.user_id}`);
            }
        }
    }
};
