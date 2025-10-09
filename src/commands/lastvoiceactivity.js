const { getSessions, getActiveSession } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

module.exports.run = async (message) => {
    const user = message.mentions.users.first() || message.author;
    const guildId = message.guild.id;

    // 🔹 1. Vérifie d'abord si l'utilisateur a une session active
    const active = getActiveSession(user.id, guildId);
    if (active) {
        const duration = Math.floor((Date.now() - active.start) / 1000);
        return message.reply(
            `<@${user.id}> est actuellement en vocal depuis ${formatTime(duration)}.`
        );
    }

    // 🔹 2. Récupère les sessions terminées
    const sessions = getSessions(user.id, guildId, 0);
    if (!sessions || sessions.length === 0) {
        return message.reply(`<@${user.id}> n'a jamais été en vocal.`);
    }

    // 🔹 4. Prend la dernière session
    const last = sessions[sessions.length - 1];
    const lastDate = new Date(last.end).toLocaleString();

    message.reply(`Dernière activité vocale de <@${user.id}> : ${lastDate}`);
};
