const { ensureUser } = require('../db/userRepository');
const { handleStartupRecalculation, handleActiveSessions } = require('../services/voiceService');

module.exports = async (client) => {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    const now = Date.now();

    for (const [guildId, guild] of client.guilds.cache) {
        await guild.members.fetch();

        // Vérifie que chaque membre est bien initialisé en DB
        guild.members.cache.forEach(member => {
            ensureUser(member.id, guildId, member.user.tag);
        });
        
        // 🎧 1️⃣ Gère les sessions actives (celles laissées ouvertes avant un crash/reboot)
        await handleActiveSessions(guild);

        // 🧮 2️⃣ Recalcule tous les totaux des utilisateurs du serveur
        await handleStartupRecalculation(guild);
    }
};
