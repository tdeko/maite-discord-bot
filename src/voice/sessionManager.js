const {
    getActiveSessions,
    endSession,
    updateLastSave,
    startSession
} = require('../db/sessionRepository');
const { addTime } = require('../db/userRepository');
const { client } = require('../core/client');

/**
 * 🔁 Vérifie et synchronise les sessions vocales avec la réalité Discord.
 * 100 % fiable, même si Discord rate un event ou si le cache des membres est incomplet.
 */
function updateActiveSessions() {
    const now = Date.now();

    // 1️⃣ Construire une carte de la "réalité" Discord : qui est VRAIMENT en vocal
    const connectedMap = new Map(); // key = guild_id:user_id
    for (const guild of client.guilds.cache.values()) {
        for (const [channelId, channel] of guild.channels.cache) {
            if (channel.type !== 2) continue; // 2 = salon vocal
            for (const [userId, member] of channel.members) {
                if (member.user.bot) continue;
                connectedMap.set(`${guild.id}:${userId}`, { guildId: guild.id, userId });
            }
        }
    }

    // 2️⃣ Récupère toutes les sessions actives en DB
    const active = getActiveSessions();

    // 3️⃣ Vérifie chaque session existante
    for (const s of active) {
        const key = `${s.guild_id}:${s.user_id}`;
        const isStillConnected = connectedMap.has(key);

        if (isStillConnected) {
            // Toujours connecté → met à jour la sauvegarde
            updateLastSave(s.user_id, s.guild_id, now);
            connectedMap.delete(key); // traité
        } else {
            // Déconnecté → clôture à la dernière sauvegarde connue
            const safeEnd = s.last_save_time || s.start;
            const duration = endSession(s.user_id, s.guild_id, safeEnd);
            if (duration > 0) {
                addTime(s.user_id, s.guild_id, duration);
                console.log(`🕓 Session clôturée proprement pour ${s.user_id}`);
            }
        }
    }

    // 4️⃣ Crée les sessions manquantes (utilisateurs en vocal sans session DB)
    for (const { guildId, userId } of connectedMap.values()) {
        console.log(`⚠️ Session manquante détectée pour ${userId}, création...`);
        startSession(userId, guildId, now);
    }
}

module.exports = { updateActiveSessions };
