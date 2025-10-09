const { getUser } = require('../db/userRepository');
const { getSessions, getActiveSession } = require('../db/sessionRepository');
const formatTime = require('../utils/formatTime');

module.exports.run = async (message, args) => {
    const guild = message.guild;
    const guildId = guild.id;

    // 🔹 Si un nombre est passé en argument → période en jours
    const daysArg = args.find(a => !isNaN(a));
    const days = daysArg ? parseInt(daysArg) : null;

    const now = Date.now();
    const since = days ? now - days * 24 * 3600 * 1000 : 0;

    // 🔹 Récupère les membres du serveur (non-bots uniquement)
    await guild.members.fetch();
    const members = guild.members.cache.filter(m => !m.user.bot);

    const ranking = [];

    for (const [id, member] of members) {
        let totalTime = 0;

        if (days) {
            // Sessions terminées dans la période
            const sessions = getSessions(id, guildId, since);
            totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
        } else {
            // Temps total global
            const user = getUser(id, guildId);
            totalTime = user?.total_time || 0;
        }

        // 🔹 Ajoute la session active (si l'utilisateur est connecté)
        const active = getActiveSession(id, guildId);
        if (active) {
            totalTime += Math.floor((now - active.start) / 1000);
        }

        if (totalTime > 0) {
            ranking.push({
                id,
                username: member.user.tag,
                totalTime,
            });
        }
    }

    // 🔹 Trie par durée décroissante
    ranking.sort((a, b) => b.totalTime - a.totalTime);

    // 🔹 Génère le message
    const scopeText = days ? `sur les ${days} derniers jours` : `au total`;
    let reply = `🏆 **Top vocal ${scopeText} — ${guild.name}**\n\n`;

    if (ranking.length === 0) {
        return message.reply(`Personne n’a encore été en vocal sur ce serveur.`);
    }

    const top = ranking.slice(0, 10);
    for (let i = 0; i < top.length; i++) {
        const { id, username, totalTime } = top[i];
        reply += `**${i + 1}.** <@${id}> — ${formatTime(totalTime)} (${username})\n`;
    }

    message.reply(reply);
};
