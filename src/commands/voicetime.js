const { getSessions, getActiveSession } = require('../db/sessionRepository');
const { getUser } = require('../db/userRepository');
const formatTime = require('../utils/formatTime');
const { client } = require('../core/client');

module.exports.run = async (message, args) => {
    const guildId = message.guild.id;
    const target = message.mentions.users.first() || message.author;

    // Cherche un argument numérique (= nombre de jours)
    const daysArg = args.find(a => !isNaN(a));
    const days = daysArg ? parseInt(daysArg) : null;

    const now = Date.now();
    const since = days ? now - days * 24 * 3600 * 1000 : 0;

    let totalTime = 0;

    if (days) {
        // 🔹 Si période précisée → on calcule seulement depuis X jours
        const sessions = getSessions(target.id, guildId, since);
        totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    } else {
        // 🔹 Sinon → on prend juste le total historique
        const dbUser = getUser(target.id, guildId);
        totalTime = dbUser?.total_time || 0;
    }

    // 🔹 Ajoute la session en cours (si l'utilisateur est connecté)
    const guild = client.guilds.cache.get(guildId);
    const member = guild?.members.cache.get(target.id);

    if (member && member.voice.channel) {
        const active = getActiveSession(target.id, guildId);
        if (active) {
            totalTime += Math.floor((now - active.start) / 1000);
        }
    }

    const scopeText = days
        ? `sur les ${days} derniers jours`
        : `au total`;

    message.reply(
        `<@${target.id}> a passé ${formatTime(totalTime)} en vocal ${scopeText}.`
    );
};
