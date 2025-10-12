const logger = require('../utils/logger');
const { ensureUser } = require('../db/userRepository');
const { handleStartupRecalculation, handleActiveSessions } = require('../services/voiceService');
const { updateActiveSessions } = require('../voice/sessionManager');
const { startSayTool } = require('../tools/sayTool');

module.exports = async (client) => {

    logger.info(`Bot connected as ${client.user.tag}`)
    console.log(`✅ Connecté en tant que ${client.user.tag}`);

    for (const [guildId, guild] of client.guilds.cache) {
        await guild.members.fetch();

        // Vérifie que chaque membre est bien initialisé en DB
        guild.members.cache.forEach(member => {
            ensureUser(member.id, guildId, member.user.tag);
        });
        logger.info(`[${guild.name}] Members synced with database.`);
        
        // 🎧 1️⃣ Gère les sessions actives (celles laissées ouvertes avant un crash/reboot)
        logger.info(`[${guild.name}] Handling unfinished voice sessions...`);
        await handleActiveSessions(guild);

        // 🧮 2️⃣ Recalcule tous les totaux des utilisateurs du serveur
        await handleStartupRecalculation(guild);
    }

    // 🕓 3️⃣ Démarre la vérification périodique sans dupliquer si 'ready' est rappelé
    if (!client._voiceInterval) {
        client._voiceInterval = setInterval(() => {
            try {
                updateActiveSessions();
            } catch (err) {
                logger.error('Error during session update :', err);
                console.error('[SessionManager] Erreur lors de la mise à jour :', err);
            }
        }, 30 * 1000);
        logger.info('Voice activity watcher started (every 30s).');
        console.log('🧩 Surveillance vocale activée toutes les 30 secondes');
    }

    if (process.stdout.isTTY) {
        console.log('\n🧰 Mode terminal actif — tu peux envoyer des messages manuellement.');
        startSayTool(client);
    }

    logger.info('ClientReady sequence completed.');

};
